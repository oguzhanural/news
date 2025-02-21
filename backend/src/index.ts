import { ApolloServer } from '@apollo/server';
import { GraphQLError } from 'graphql';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import mongoose from 'mongoose';
import { connectDB } from './utils/db';
import { newsResolver } from './resolvers/newsResolver';
import { userResolver } from './resolvers/userResolver';
import { categoryResolver } from './resolvers/categoryResolver';
import { verifyToken } from './utils/jwt';
import { expressMiddleware } from '@apollo/server/express4';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import http, { request } from 'http';
import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config(); // Ortam değişkenlerini yükle

// Winston ile gelişmiş loglama ayarı
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp, ...metadata }) => {
      let msg = `${timestamp} [${level}] : ${message}`;
      if (Object.keys(metadata).length) {
        msg += ` ${JSON.stringify(metadata)}`;
      }
      return msg;
    })
  ),
  transports: [new winston.transports.Console()],
});

// Şema dosyasını oku
const typeDefs = readFileSync(resolve(__dirname, './schemas/schema.graphql'), 'utf-8');

// Resolverları birleştir
const resolvers = {
  Query: {
    ...userResolver.Query,
    ...categoryResolver.Query,
    ...newsResolver.Query,
  },
  Mutation: {
    ...userResolver.Mutation,
    ...categoryResolver.Mutation,
    ...newsResolver.Mutation,
  },
  News: newsResolver.News,
};

// Define the context interface
interface Context {
  userId: string | null;
}

class Server {
  private server: ApolloServer<Context>;
  private app: Application;
  private httpServer: http.Server;
  private isShuttingDown = false;
  private connectionRetryTimeout: NodeJS.Timeout | null = null;
  private readonly MAX_RETRIES = 5;
  private retryCount = 0;
  private readonly INITIAL_RETRY_INTERVAL = 5000; // Başlangıçta 5 saniye

  constructor() {
    this.app = express();
    this.httpServer = http.createServer(this.app);
    // HTTP sunucusu için zaman aşımı ayarları
    this.httpServer.timeout = 120000; // 2 minute
    this.httpServer.keepAliveTimeout = 60000; // 1 minute

    this.server = new ApolloServer<Context>({
      typeDefs,
      resolvers,
      formatError: (error) => {
        // Tüm hata detaylarını logla
        logger.error('GraphQL Error', { error });
        // Üretimde iç detayları gizle
        if (process.env.NODE_ENV === 'production') {
          return new GraphQLError('Internal server error');
        }
        return error;
      },
      csrfPrevention: true,
      cache: 'bounded',
      plugins: [
        {
          async serverWillStart() {
            logger.info('Apollo Server is starting...');
            return {
              async drainServer() {
                logger.info('Apollo Server is draining connections...');
              }
            };
        }
      }
      ],
    });
  }

  private setupMongooseOptions() {
    // Mongoose bağlantı seçeneklerini ayarla
    // NOT: Mongoose 6+ sürümünde doğrudan mongoose.set() kullanımı yerine
    // connectDB fonksiyonundaki bağlantı seçeneklerini güncellemeniz gerekir
    logger.info('Setting up Mongoose connection options');
    
    // Düzenli ping mekanizması ekleyin
    const pingInterval = setInterval(async () => {
      if (mongoose.connection.readyState === 1 && !this.isShuttingDown) {
        try {
          // Hafif bir ping işlemi yap
          await mongoose.connection.db?.admin().ping();
          logger.debug('MongoDB ping successful');
        } catch (error) {
          logger.warn('MongoDB ping failed', { error });
          // Bağlantıyı yeniden kurmayı dene
          this.handleDatabaseError();
        }
      }
    }, 60000); // Her dakika kontrol et
    
    // Sunucu kapanırken interval'i temizle
    process.on('beforeExit', () => {
      clearInterval(pingInterval);
    });
  }

  private async setupMiddleware() {

  // request timeout middleware'i
  const requestTimeout = (req: Request, res: Response, next: Function) => {
    res.setTimeout(30000, () => {
      logger.warn('Request timeout detected');
      if (!res.headersSent) {
        res.status(503).json({ error: 'Service temporarily unavailable, please try again' });
      }
    });
    next();
  };
  
  this.app.use(requestTimeout);

    // CORS configuration with multiple origins
    const allowedOrigins = [
      'http://localhost:3000',  // Main frontend
      'http://localhost:3001',  // Admin dashboard
      process.env.CORS_ORIGIN   // Any additional origin from env
    ].filter(Boolean); // Remove any undefined values

    this.app.use(
      cors({
        origin: function(origin, callback) {
          // Allow requests with no origin (like mobile apps or curl requests)
          if (!origin) return callback(null, true);
          
          if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
          } else {
            logger.warn(`Blocked request from unauthorized origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
          }
        },
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'apollo-require-preflight']
      })
    );

    // JSON body parser
    this.app.use(express.json());

    // Gelişmiş sağlık kontrolü (veritabanı bağlantısı kontrolü de yapılıyor)
    this.app.get('/health', async (_: Request, res: Response) => {
      const dbState = mongoose.connection.readyState;
      // mongoose.connection.readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
      if (dbState === 1) {
        res.status(200).json({ status: 'ok', db: 'connected' });
      } else {
        res.status(503).json({ status: 'fail', db: 'disconnected' });
      }
    });

    // Apollo Server middleware'ini uygulamaya ekle
    await this.server.start();

    this.app.use(
      '/graphql',
      expressMiddleware(this.server, {
        context: async ({ req }: { req: Request }): Promise<Context> => {
          // Get the token from the Authorization header
          const token = req.headers.authorization?.split(' ')[1] || '';
          
          try {
            // Verify the token and get userId
            const decoded = await verifyToken(token);
            return { userId: decoded?.userId || null };
          } catch (error) {
            return { userId: null };
          }
        },
      })
    );
  }

  private async setupDatabaseConnection() {
    const connectWithRetry = async () => {
      try {
        // Mevcut bağlantıyı kapatmayı dene (varsa)
        if (mongoose.connection.readyState !== 0) {
          try {
            await mongoose.connection.close();
            logger.info('Closed existing MongoDB connection before reconnecting');
          } catch (err) {
            logger.warn('Error closing existing connection', { err });
          }
        }
        
        // Yeni bağlantı kurma
        await connectDB();
        logger.info('Connected to MongoDB');
        this.retryCount = 0;
        
        // Mongoose connection event listeners...
      } catch (error) {
        logger.error('Failed to connect to MongoDB', { error });
        this.handleDatabaseError();
      }
    };
    
    await connectWithRetry();
  }

  // Ping mekanizmasını ayrı bir fonksiyona çıkaralım
  private setupMongoPing() {
    const pingInterval = setInterval(async () => {
      if (mongoose.connection.readyState === 1 && !this.isShuttingDown) {
        try {
          // Hafif bir ping işlemi yap
          await mongoose.connection.db?.admin().ping();
          logger.debug('MongoDB ping successful');
        } catch (error) {
          logger.warn('MongoDB ping failed', { error });
          // Bağlantıyı yeniden kurmayı dene
          this.handleDatabaseError();
        }
      }
    }, 60000); // Her dakika kontrol et
    
    // Server kapanırken interval'i temizle
    process.on('beforeExit', () => {
      clearInterval(pingInterval);
    });
  }

  // Üstel geri çekilme (exponential backoff) stratejisiyle veritabanı yeniden bağlantı denemesi
  private handleDatabaseError() {
    if (this.isShuttingDown) return;

    if (this.retryCount < this.MAX_RETRIES) {
      this.retryCount++;
      const retryInterval = this.INITIAL_RETRY_INTERVAL * Math.pow(2, this.retryCount - 1);
      logger.warn(`Retrying database connection (${this.retryCount}/${this.MAX_RETRIES}) in ${retryInterval} ms...`);

      if (this.connectionRetryTimeout) {
        clearTimeout(this.connectionRetryTimeout);
      }
      this.connectionRetryTimeout = setTimeout(() => {
        this.setupDatabaseConnection();
      }, retryInterval);
    } else {
      logger.error('Max retry attempts reached. Server shutting down...');
      this.shutdown(1);
    }
  }

  private setupGracefulShutdown() {
    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    signals.forEach((signal) => {
      process.on(signal, () => {
        logger.info(`${signal} received. Starting graceful shutdown...`);
        this.shutdown(0);
      });
    });

    // Uncaught exceptions ve unhandled promise rejection durumlarını yakala
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error });
      this.shutdown(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
      this.shutdown(1);
    });
  }

  // Graceful shutdown; belirli bir süreden sonra (ör. 10 saniye) zorla kapanışı tetikler
  private async shutdown(code: number) {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;
    logger.info('Shutting down server...');

    const forcedShutdown = setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(code);
    }, 10000); // 10 saniye

    try {
      if (this.connectionRetryTimeout) {
        clearTimeout(this.connectionRetryTimeout);
      }

      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
      }

      await this.server.stop();
      logger.info('Apollo Server stopped');

      await new Promise<void>((resolve, reject) => {
        this.httpServer.close((err) => (err ? reject(err) : resolve()));
      });
      logger.info('HTTP server closed');

      clearTimeout(forcedShutdown);
      process.exit(code);
    } catch (error) {
      logger.error('Error during shutdown', { error });
      process.exit(1);
    }
  }

  public async start() {
    try {
      this.setupGracefulShutdown();

      // Mongoose seçeneklerini ayarla
      this.setupMongooseOptions();

      // Düzenli ping kontrolünü başlat
      this.setupMongoPing();

      await this.setupDatabaseConnection();
      await this.setupMiddleware();

      const port = process.env.PORT ? parseInt(process.env.PORT) : 4000;
      await new Promise<void>((resolve) => {
        this.httpServer.listen(port, () => {
          logger.info(`🚀 Server ready at http://localhost:${port}/graphql`);
          resolve();
        });
      });
    } catch (error) {
      logger.error('Failed to start server', { error });
      this.shutdown(1);
    }
  }
}

// Server'ı başlat
const server = new Server();
server.start().catch((error) => {
  logger.error('Server startup error', { error });
  process.exit(1);
});
