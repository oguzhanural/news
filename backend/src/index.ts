import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { connectDB } from './utils/db';
import { newsResolver } from './resolvers/newsResolver';
import { userResolver } from './resolvers/userResolver';
import { categoryResolver } from './resolvers/categoryResolver';
import { verifyToken } from './utils/jwt';

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

async function startServer() {
  // Connect to MongoDB
  await connectDB();

  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  // Start the server
  const { url } = await startStandaloneServer(server, {
    context: async ({ req }) => {
      // Get the user token from the headers
      const token = req.headers.authorization || '';
      
      // Try to retrieve a user with the token
      const userId = token ? await verifyToken(token.replace('Bearer ', '')) : null;
      
      // Add the user to the context
      return { userId };
    },
    listen: { port: 4000 }
  });

  console.log(`🚀 Server ready at ${url}`);
}

startServer().catch(console.error); 