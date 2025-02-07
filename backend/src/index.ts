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
import http from 'http';
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

class Server {
  private server: ApolloServer;
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

    this.server = new ApolloServer({
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
    });
  }

  private async setupMiddleware() {
    // CORS yapılandırması
    const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
    this.app.use(cors({ origin: corsOrigin, credentials: true }));

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
        context: async ({ req }) => {
          let userId: string | null = null;
          try {
            const authHeader = req.headers.authorization || '';
            if (authHeader) {
              const token = authHeader.replace('Bearer ', '');
              userId = await verifyToken(token);
            }
          } catch (error) {
            logger.error('Error in context function', { error });
          }
          return { userId };
        },
      })
    );
  }

  private async setupDatabaseConnection() {
    try {
      await connectDB();
      logger.info('Connected to MongoDB');
      this.retryCount = 0; // Bağlantı sağlandığında retry sayacını sıfırla

      // MongoDB hata ve bağlantı kesilme durumlarını dinle
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error', { error });
        this.handleDatabaseError();
      });

      mongoose.connection.on('disconnected', () => {
        if (!this.isShuttingDown) {
          logger.warn('MongoDB disconnected. Attempting to reconnect...');
          this.handleDatabaseError();
        }
      });
    } catch (error) {
      logger.error('Failed to connect to MongoDB', { error });
      this.handleDatabaseError();
    }
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
