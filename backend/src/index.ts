import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';
import { connectDB } from './utils/db';
import { resolvers } from './resolvers';
import jwt from 'jsonwebtoken';
import { User } from './models/User';

// Load environment variables
dotenv.config();

// Read schemas
const newsTypeDefs = readFileSync(resolve(__dirname, './schemas/news.graphql'), {
  encoding: 'utf-8',
});

const userTypeDefs = readFileSync(resolve(__dirname, './schemas/user.graphql'), {
  encoding: 'utf-8',
});

const categoryTypeDefs = readFileSync(resolve(__dirname, './schemas/category.graphql'), {
  encoding: 'utf-8',
});

// Combine type definitions
const typeDefs = `
  ${newsTypeDefs}
  ${userTypeDefs}
  ${categoryTypeDefs}

  # Merge root types
  type Query {
    # News queries
    news(id: ID!): News
    newsList(category: ID, status: NewsStatus, limit: Int, offset: Int): [News!]!
    
    # User queries
    user(id: ID!): User
    users: [User!]!
    
    # Category queries
    categories: [Category!]!
  }

  type Mutation {
    # News mutations
    createNews(input: CreateNewsInput!): News!
    updateNews(input: UpdateNewsInput!): News!
    deleteNews(id: ID!): Boolean!
    
    # User mutations
    registerUser(input: RegisterUserInput!): AuthPayload!
    loginUser(input: LoginUserInput!): AuthPayload!
    updateUser(id: ID!, input: RegisterUserInput!): User!
    deleteUser(id: ID!): Boolean!
    
    # Category mutations
    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(id: ID!, input: UpdateCategoryInput!): Category!
    deleteCategory(id: ID!): Boolean!
  }
`;

// Initialize express
const app = express();

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Context function to handle authentication
const getUser = async (token: string) => {
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
    const user = await User.findById(decoded.userId).select('-password');
    return user;
  } catch (error) {
    return null;
  }
};

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Start Apollo Server
  await server.start();

  // Apply middleware
  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        // Get token from header
        const token = req.headers.authorization?.split(' ')[1] || '';
        const user = await getUser(token);
        
        return { 
          user,
          userId: user?._id 
        };
      }
    }),
  );

  // Start express server
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
}); 