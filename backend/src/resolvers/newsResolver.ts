import { News } from '../models/News';
import { Category } from '../models/Category';
import { User } from '../models/User';
import { GraphQLError } from 'graphql';

interface CreateNewsInput {
  title: string;
  content: string;
  summary?: string;
  imageUrl?: string;
  categoryId: string;
  tags?: string[];
}

interface UpdateNewsInput {
  id: string;
  title?: string;
  content?: string;
  summary?: string;
  imageUrl?: string;
  categoryId?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  tags?: string[];
}

export const newsResolver = {
  Query: {
    // Get single news by ID
    news: async (_: any, { id }: { id: string }) => {
      try {
        const news = await News.findById(id)
          .populate('category')
          .populate('author', '-password');
        
        if (!news) {
          throw new GraphQLError('News not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }
        
        return news;
      } catch (error: unknown) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError('Error fetching news', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    // Get list of news with filters
    newsList: async (_: any, args: {
      category?: string;
      status?: string;
      limit?: number;
      offset?: number;
    }) => {
      try {
        let query: any = {};

        if (args.category) {
          query.category = args.category;
        }

        if (args.status) {
          query.status = args.status;
        }

        const news = await News.find(query)
          .populate('category')
          .populate('author', '-password')
          .sort({ publishDate: -1 })
          .skip(args.offset || 0)
          .limit(args.limit || 10);

        return news;
      } catch (error: unknown) {
        throw new GraphQLError('Error fetching news list', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    }
  },

  Mutation: {
    // Create new news article
    createNews: async (_: any, { input }: { input: CreateNewsInput }, context: any) => {
      try {
        if (!context.userId) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        const category = await Category.findById(input.categoryId);
        if (!category) {
          throw new GraphQLError('Category not found', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        const news = new News({
          ...input,
          author: context.userId,
          status: 'DRAFT'
        });

        await news.save();

        return await News.findById(news._id)
          .populate('category')
          .populate('author', '-password');
      } catch (error: unknown) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        if (error instanceof Error) {
          throw new GraphQLError(`Error creating news: ${error.message}`, {
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
          });
        }
        throw new GraphQLError('Error creating news', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    // Update news article
    updateNews: async (_: any, { input }: { input: UpdateNewsInput }, context: any) => {
      try {
        if (!context.userId) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        const news = await News.findByIdAndUpdate(
          input.id,
          { $set: input },
          { new: true, runValidators: true }
        )
          .populate('category')
          .populate('author', '-password');

        if (!news) {
          throw new GraphQLError('News not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        return news;
      } catch (error: unknown) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        if (error instanceof Error) {
          throw new GraphQLError(`Error updating news: ${error.message}`, {
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
          });
        }
        throw new GraphQLError('Error updating news', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    // Delete news article
    deleteNews: async (_: any, { id }: { id: string }, context: any) => {
      try {
        if (!context.userId) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        const news = await News.findByIdAndDelete(id);
        if (!news) {
          throw new GraphQLError('News not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }
        return true;
      } catch (error: unknown) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        if (error instanceof Error) {
          throw new GraphQLError(`Error deleting news: ${error.message}`, {
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
          });
        }
        throw new GraphQLError('Error deleting news', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    }
  },

  // Field Resolvers
  News: {
    category: async (parent: any) => {
      try {
        return await Category.findById(parent.category);
      } catch (error: unknown) {
        throw new GraphQLError('Error fetching category', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },
    author: async (parent: any) => {
      try {
        return await User.findById(parent.author).select('-password');
      } catch (error: unknown) {
        throw new GraphQLError('Error fetching author', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    }
  }
}; 