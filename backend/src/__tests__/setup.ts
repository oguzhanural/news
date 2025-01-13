import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

let mongod: MongoMemoryServer;

// Connect to the in-memory database
export const connectDB = async () => {
  try {
    mongod = await MongoMemoryServer.create({
      instance: {
        dbName: 'jest'
      }
    });
    const uri = mongod.getUri();
    
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      family: 4
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Clear all data between tests
export const clearDB = async () => {
  if (!mongoose.connection.db) {
    throw new Error('Database not connected');
  }
  const collections = await mongoose.connection.db.collections();
  await Promise.all(
    collections.map(collection => collection.deleteMany({}))
  );
};

// Close database connection
export const closeDB = async () => {
  try {
    if (mongod) {
      await mongoose.disconnect();
      await mongod.stop();
    }
  } catch (error) {
    console.error('Error closing database:', error);
    throw error;
  }
};

// Global test utilities
export const createTestToken = (userId: string) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}; 