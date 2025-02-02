import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import mongoose from 'mongoose';
import { connectDB } from './utils/db';
import { newsResolver } from './resolvers/newsResolver';
import { userResolver } from './resolvers/userResolver';
import { categoryResolver } from './resolvers/categoryResolver';
import { verifyToken } from './utils/jwt';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import cors from 'cors';
import http from 'http';

// Read the combined schema
const typeDefs = readFileSync(resolve(__dirname, './schemas/schema.graphql'), 'utf-8');

// Combine resolvers
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
  private app: express.Application;
  private httpServer: http.Server;
  private isShuttingDown = false;
  private connectionRetryTimeout: NodeJS.Timeout | null = null;
  private readonly MAX_RETRIES = 5;
  private retryCount = 0;
  private readonly RETRY_INTERVAL = 5000; // 5 seconds

  constructor() {
    this.app = express();
    this.httpServer = http.createServer(this.app);
    
    this.server = new ApolloServer({
      typeDefs,
      resolvers,
      formatError: (error) => {
        console.error('GraphQL Error:', error);
        // Don't expose internal errors to clients in production
        return process.env.NODE_ENV === 'production' 
          ? { message: 'Internal server error' }
          : error;
      },
      csrfPrevention: true, // Enable CSRF prevention
      cache: 'bounded', // Recommended for production
    });
  }

  private async setupMiddleware() {
    // Enable CORS
    this.app.use(
      cors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
      })
    );

    // Body parser middleware
    this.app.use(express.json());

    // Health check endpoint
    this.app.get('/health', (_, res) => {
      res.status(200).json({ status: 'ok' });
    });

    // Apply Apollo middleware
    await this.server.start();
    
    this.app.use(
      '/graphql',
      expressMiddleware(this.server, {
        context: async ({ req }) => {
          try {
            const token = req.headers.authorization || '';
            const userId = token ? await verifyToken(token.replace('Bearer ', '')) : null;
            return { userId };
          } catch (error) {
            console.error('Error in context function:', error);
            return { userId: null };
          }
        },
      })
    );
  }

  private async setupDatabaseConnection() {
    try {
      await connectDB();
      console.log('📦 Connected to MongoDB');
      
      // Reset retry count on successful connection
      this.retryCount = 0;

      // Setup MongoDB connection error handlers
      mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error);
        this.handleDatabaseError();
      });

      mongoose.connection.on('disconnected', () => {
        if (!this.isShuttingDown) {
          console.log('MongoDB disconnected. Attempting to reconnect...');
          this.handleDatabaseError();
        }
      });

    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      this.handleDatabaseError();
    }
  }

  private handleDatabaseError() {
    if (this.isShuttingDown) return;

    if (this.retryCount < this.MAX_RETRIES) {
      this.retryCount++;
      console.log(`Retrying database connection (${this.retryCount}/${this.MAX_RETRIES})...`);
      
      // Clear any existing retry timeout
      if (this.connectionRetryTimeout) {
        clearTimeout(this.connectionRetryTimeout);
      }

      // Set new retry timeout
      this.connectionRetryTimeout = setTimeout(() => {
        this.setupDatabaseConnection();
      }, this.RETRY_INTERVAL);
    } else {
      console.error('Max retry attempts reached. Server shutting down...');
      this.shutdown(1);
    }
  }

  private setupGracefulShutdown() {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    
    signals.forEach((signal) => {
      process.on(signal, () => {
        console.log(`\n${signal} received. Starting graceful shutdown...`);
        this.shutdown(0);
      });
    });

    // Handle uncaught exceptions and unhandled rejections
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.shutdown(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.shutdown(1);
    });
  }

  private async shutdown(code: number) {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    console.log('Shutting down server...');

    try {
      // Clear any pending retry attempts
      if (this.connectionRetryTimeout) {
        clearTimeout(this.connectionRetryTimeout);
      }

      // Close MongoDB connection
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
      }

      // Stop Apollo Server
      await this.server.stop();
      console.log('Apollo Server stopped');

      // Close HTTP server
      await new Promise<void>((resolve) => {
        this.httpServer.close(() => resolve());
      });
      console.log('HTTP server closed');

      // Exit process
      process.exit(code);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  public async start() {
    try {
      // Setup graceful shutdown handlers
      this.setupGracefulShutdown();

      // Connect to database
      await this.setupDatabaseConnection();

      // Setup middleware and start Apollo Server
      await this.setupMiddleware();

      // Start HTTP server
      const port = process.env.PORT ? parseInt(process.env.PORT) : 4000;
      await new Promise<void>((resolve) => {
        this.httpServer.listen(port, () => {
          console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
          resolve();
        });
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      this.shutdown(1);
    }
  }
}

// Start server
const server = new Server();
server.start().catch((error) => {
  console.error('Server startup error:', error);
  process.exit(1);
}); 