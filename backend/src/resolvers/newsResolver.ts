import { News } from '../models/News';
import { Category } from '../models/Category';
import { User } from '../models/User';
import { GraphQLError } from 'graphql';

interface Image {
  url: string;
  caption?: string;
  isMain: boolean;
}

interface CreateNewsInput {
  title: string;
  content: string;
  summary: string;
  images: Image[];
  categoryId: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  tags?: string[];
}

interface UpdateNewsInput {
  title?: string;
  content?: string;
  summary?: string;
  images?: Image[];
  categoryId?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  tags?: string[];
}

// New interface for update data that includes all possible fields
interface NewsUpdateData extends UpdateNewsInput {
  publishDate?: string;
  updatedAt: string;
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
          .sort({ publishDate: -1, createdAt: -1 })
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
        // Authentication check
        if (!context.userId) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        // Check if user has permission to create news
        const author = await User.findById(context.userId);
        if (!author || (author.role !== 'EDITOR' && author.role !== 'JOURNALIST' && author.role !== 'ADMIN')) {
          throw new GraphQLError('Not authorized to create news', {
            extensions: { code: 'FORBIDDEN' }
          });
        }

        // Validate category
        const category = await Category.findById(input.categoryId);
        if (!category) {
          throw new GraphQLError('Category not found', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        // Validate images
        if (!input.images.length) {
          throw new GraphQLError('At least one image is required', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        // Ensure exactly one main image
        const mainImages = input.images.filter(img => img.isMain);
        if (mainImages.length !== 1) {
          throw new GraphQLError('Exactly one main image must be specified', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        // Set publishDate if status is PUBLISHED
        const publishDate = input.status === 'PUBLISHED' ? new Date().toISOString() : null;

        const news = new News({
          ...input,
          category: input.categoryId,
          author: context.userId,
          publishDate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
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
    updateNews: async (_: any, { id, input }: { id: string, input: UpdateNewsInput }, context: any) => {
      try {
        // Authentication check
        if (!context.userId) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        // Find existing news
        const existingNews = await News.findById(id);
        if (!existingNews) {
          throw new GraphQLError('News not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        // Check authorization
        const currentUser = await User.findById(context.userId);
        if (!currentUser) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        // Only author or admin can update
        if (existingNews.author.toString() !== context.userId && currentUser.role !== 'ADMIN') {
          throw new GraphQLError('Not authorized to update this news', {
            extensions: { code: 'FORBIDDEN' }
          });
        }

        // Validate category if provided
        if (input.categoryId) {
          const category = await Category.findById(input.categoryId);
          if (!category) {
            throw new GraphQLError('Category not found', {
              extensions: { code: 'BAD_USER_INPUT' }
            });
          }
        }

        // Validate images if provided
        if (input.images) {
          if (!input.images.length) {
            throw new GraphQLError('At least one image is required', {
              extensions: { code: 'BAD_USER_INPUT' }
            });
          }

          const mainImages = input.images.filter(img => img.isMain);
          if (mainImages.length !== 1) {
            throw new GraphQLError('Exactly one main image must be specified', {
              extensions: { code: 'BAD_USER_INPUT' }
            });
          }
        }

        // Update publishDate if status is changing to PUBLISHED
        const updateData: NewsUpdateData = {
          ...input,
          updatedAt: new Date().toISOString()
        };
        
        if (input.status === 'PUBLISHED' && existingNews.status !== 'PUBLISHED') {
          updateData.publishDate = new Date().toISOString();
        }

        const news = await News.findByIdAndUpdate(
          id,
          { $set: updateData },
          { new: true, runValidators: true }
        )
          .populate('category')
          .populate('author', '-password');

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
        // Authentication check
        if (!context.userId) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        // Find existing news
        const existingNews = await News.findById(id);
        if (!existingNews) {
          throw new GraphQLError('News not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        // Check authorization
        const currentUser = await User.findById(context.userId);
        if (!currentUser) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        // Only author or admin can delete
        if (existingNews.author.toString() !== context.userId && currentUser.role !== 'ADMIN') {
          throw new GraphQLError('Not authorized to delete this news', {
            extensions: { code: 'FORBIDDEN' }
          });
        }

        await News.findByIdAndDelete(id);
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