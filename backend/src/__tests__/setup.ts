import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

let mongod: MongoMemoryServer;

// Connect to the in-memory database
export const connectDB = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  // Set higher timeout and buffer options
  const mongooseOpts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    maxPoolSize: 10
  };

  await mongoose.connect(uri, mongooseOpts);
};

// Clear all data between tests
export const clearDB = async () => {
  if (!mongoose.connection.db) {
    throw new Error('Database not connected');
  }
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
};

// Close database connection
export const closeDB = async () => {
  await mongoose.disconnect();
  await mongod.stop();
};

// Global test utilities
export const createTestToken = (userId: string) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}; 