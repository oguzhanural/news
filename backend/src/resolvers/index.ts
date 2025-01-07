import { categoryResolver } from './categoryResolver';
import { userResolver } from './userResolver';
import { newsResolver } from './newsResolver';

export const resolvers = {
  Query: {
    ...categoryResolver.Query,
    ...userResolver.Query,
    ...newsResolver.Query
  },
  Mutation: {
    ...categoryResolver.Mutation,
    ...userResolver.Mutation,
    ...newsResolver.Mutation
  },
  News: newsResolver.News
}; 