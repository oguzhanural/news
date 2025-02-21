import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Always use MongoDB Atlas
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.vlapc.mongodb.net/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;

const connectWithRetry = async () => {
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 5000; // 5 seconds
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      await mongoose.connect(MONGODB_URI, {
        maxPoolSize: 10,
        minPoolSize: 2,
        maxConnecting: 2,
        heartbeatFrequencyMS: 30000,
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        family: 4
      });
      
      console.log('🌿 MongoDB Atlas connected successfully');
      break;
    } catch (error) {
      retries++;
      console.error(`MongoDB connection attempt ${retries} failed:`, error);
      
      if (retries === MAX_RETRIES) {
        console.error('Max retries reached. Could not connect to MongoDB Atlas');
        throw error;
      }
      
      console.log(`Retrying in ${RETRY_DELAY/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
};

export const connectDB = async () => {
  try {
    await connectWithRetry();

    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
      connectWithRetry();
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('Could not connect to MongoDB:', error);
    process.exit(1);
  }
}; 