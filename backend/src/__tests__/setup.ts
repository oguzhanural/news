import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

let mongod: MongoMemoryServer;

// Setup before all tests
beforeAll(async () => {
  // Create an in-memory MongoDB instance
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

// Clear database between tests
beforeEach(async () => {
  if (!mongoose.connection.db) {
    throw new Error('Database not connected');
  }
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

// Global test utilities
export const createTestToken = (userId: string) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}; 