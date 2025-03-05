import { News } from '../models/News';
import { Category } from '../models/Category';
import { User } from '../models/User';
import { GraphQLError } from 'graphql';
import mongoose from 'mongoose';
import { isValidCloudinaryUrl, deleteCloudinaryImageByUrl, isCloudinaryConfigured } from '../utils/cloudinary';
import { 
  processRichTextContent, 
  validateContentImages, 
  createSummaryFromContent 
} from '../utils/content';

interface Image {
  url: string;
  caption?: string;
  altText?: string;
  credit?: string;
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
  id: string;
  title?: string;
  content?: string;
  summary?: string;
  images?: Image[];
  categoryId?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  tags?: string[];
}

// New interface for update data that includes all possible fields
interface NewsUpdateData extends Omit<UpdateNewsInput, 'id'> {
  publishDate?: string;
  updatedAt: string;
}

interface SearchNewsInput {
  query: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  categoryId?: string;
  tags?: string[];
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

interface NewsFilterInput {
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  categoryId?: string;
  authorId?: string;
  tags?: string[];
  fromDate?: string;
  toDate?: string;
}

interface NewsSortInput {
  field: 'CREATED_AT' | 'UPDATED_AT' | 'TITLE' | 'STATUS';
  order: 'ASC' | 'DESC';
}

// Helper to find removed images when updating news
const findRemovedImages = (oldImages: Image[], newImages: Image[]): string[] => {
  if (!oldImages || !newImages) return [];
  
  const newUrls = new Set(newImages.map(img => img.url));
  return oldImages
    .filter(oldImg => !newUrls.has(oldImg.url))
    .map(img => img.url);
};

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
      filter?: NewsFilterInput;
      sort?: NewsSortInput;
      limit?: number;
      offset?: number;
    }) => {
      try {
        const { filter, sort, limit = 10, offset = 0 } = args;
        let query: any = {};

        // Apply filters
        if (filter) {
          if (filter.status) {
            query.status = filter.status;
          }

          if (filter.categoryId) {
            query.category = new mongoose.Types.ObjectId(filter.categoryId);
          }

          if (filter.authorId) {
            query.author = new mongoose.Types.ObjectId(filter.authorId);
          }

          if (filter.tags && filter.tags.length > 0) {
            query.tags = { $in: filter.tags };
          }

          if (filter.fromDate || filter.toDate) {
            query.createdAt = {};
            if (filter.fromDate) {
              query.createdAt.$gte = new Date(filter.fromDate);
            }
            if (filter.toDate) {
              query.createdAt.$lte = new Date(filter.toDate);
            }
          }
        }

        // Build sort object
        let sortObj: any = { createdAt: -1 }; // Default sort
        if (sort) {
          const sortField = sort.field.toLowerCase().replace(/_(.)/g, (_, c) => c.toUpperCase());
          sortObj = {
            [sortField]: sort.order === 'ASC' ? 1 : -1
          };
        }

        // Execute query with pagination
        const [news, total] = await Promise.all([
          News.find(query)
            .populate('category')
            .populate('author', '-password')
            .sort(sortObj)
            .skip(offset)
            .limit(limit + 1),
          News.countDocuments(query)
        ]);

        // Check if there are more results
        const hasMore = news.length > limit;
        if (hasMore) {
          news.pop(); // Remove the extra item we fetched
        }

        return {
          news,
          total,
          hasMore
        };
      } catch (error: unknown) {
        throw new GraphQLError('Error fetching news list', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    searchNews: async (_: any, { input }: { input: SearchNewsInput }) => {
      try {
        const { 
          query, 
          status, 
          categoryId, 
          tags, 
          fromDate, 
          toDate, 
          limit = 10, 
          offset = 0 
        } = input;

        // Build search criteria
        const searchCriteria: any = {
          $text: { $search: query }
        };

        // Add filters if provided
        if (status) {
          searchCriteria.status = status;
        }

        if (categoryId) {
          searchCriteria.category = new mongoose.Types.ObjectId(categoryId);
        }

        if (tags && tags.length > 0) {
          searchCriteria.tags = { $in: tags };
        }

        if (fromDate || toDate) {
          searchCriteria.createdAt = {};
          if (fromDate) {
            searchCriteria.createdAt.$gte = new Date(fromDate);
          }
          if (toDate) {
            searchCriteria.createdAt.$lte = new Date(toDate);
          }
        }

        // Execute search query
        const [news, total] = await Promise.all([
          News.find(
            searchCriteria,
            { score: { $meta: 'textScore' } }
          )
            .sort({ score: { $meta: 'textScore' } })
            .skip(offset)
            .limit(limit + 1) // Get one extra to check if there are more results
            .populate('author')
            .populate('category'),
          News.countDocuments(searchCriteria)
        ]);

        // Check if there are more results
        const hasMore = news.length > limit;
        if (hasMore) {
          news.pop(); // Remove the extra item we fetched
        }

        return {
          news,
          total,
          hasMore
        };
      } catch (error: any) {
        throw new GraphQLError(`Error searching news: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    }
  },

  Mutation: {
    // Create new news article
    createNews: async (_: any, { input }: { input: CreateNewsInput }, context: any) => {
      try {
        // Check if Cloudinary is configured
        if (!isCloudinaryConfigured()) {
          throw new GraphQLError('Cloudinary is not configured properly for image management', {
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
          });
        }

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

        // Process and sanitize content
        const processedContent = processRichTextContent(input.content);

        // Validate embedded images in content
        if (!validateContentImages(processedContent)) {
          throw new GraphQLError('Invalid image URLs detected in content. All images must be from Cloudinary', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        // Generate summary if not provided or empty
        let summary = input.summary;
        if (!summary || summary.trim() === '') {
          summary = createSummaryFromContent(processedContent);
        }

        // Validate images
        if (!input.images || !input.images.length) {
          throw new GraphQLError('At least one image is required', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        // Validate Cloudinary URLs
        for (const image of input.images) {
          if (!isValidCloudinaryUrl(image.url)) {
            throw new GraphQLError('Invalid image URL format. Must be a Cloudinary URL', {
              extensions: { code: 'BAD_USER_INPUT' }
            });
          }
        }

        // Ensure exactly one main image
        const mainImages = input.images.filter(img => img.isMain);
        if (mainImages.length !== 1) {
          throw new GraphQLError('Exactly one main image must be specified', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        // Set publishDate if status is PUBLISHED
        const publishDate = input.status === 'PUBLISHED' ? new Date() : null;

        const news = new News({
          ...input,
          content: processedContent, 
          summary,
          category: input.categoryId,
          author: context.userId,
          publishDate
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
        // Check if Cloudinary is configured
        if (!isCloudinaryConfigured()) {
          throw new GraphQLError('Cloudinary is not configured properly for image management', {
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
          });
        }

        // Authentication check
        if (!context.userId) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        const { id, ...updateFields } = input;

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
        if (updateFields.categoryId) {
          const category = await Category.findById(updateFields.categoryId);
          if (!category) {
            throw new GraphQLError('Category not found', {
              extensions: { code: 'BAD_USER_INPUT' }
            });
          }
        }

        // Process content if provided
        if (updateFields.content) {
          updateFields.content = processRichTextContent(updateFields.content);
          
          // Validate embedded images in content
          if (!validateContentImages(updateFields.content)) {
            throw new GraphQLError('Invalid image URLs detected in content. All images must be from Cloudinary', {
              extensions: { code: 'BAD_USER_INPUT' }
            });
          }
          
          // Generate summary if not provided but content is updated
          if (!updateFields.summary || updateFields.summary.trim() === '') {
            updateFields.summary = createSummaryFromContent(updateFields.content);
          }
        }

        // Handle image updates
        if (updateFields.images) {
          if (!updateFields.images.length) {
            throw new GraphQLError('At least one image is required', {
              extensions: { code: 'BAD_USER_INPUT' }
            });
          }

          // Validate Cloudinary URLs
          for (const image of updateFields.images) {
            if (!isValidCloudinaryUrl(image.url)) {
              throw new GraphQLError('Invalid image URL format. Must be a Cloudinary URL', {
                extensions: { code: 'BAD_USER_INPUT' }
              });
            }
          }

          const mainImages = updateFields.images.filter(img => img.isMain);
          if (mainImages.length !== 1) {
            throw new GraphQLError('Exactly one main image must be specified', {
              extensions: { code: 'BAD_USER_INPUT' }
            });
          }

          // Find removed images and delete them from Cloudinary
          const removedImageUrls = findRemovedImages(existingNews.images, updateFields.images);
          for (const imageUrl of removedImageUrls) {
            await deleteCloudinaryImageByUrl(imageUrl);
          }
        }

        // Update publishDate if status is changing to PUBLISHED
        const updateData: NewsUpdateData = {
          ...updateFields,
          updatedAt: new Date().toISOString()
        };
        
        if (updateFields.status === 'PUBLISHED' && existingNews.status !== 'PUBLISHED') {
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
        // Check if Cloudinary is configured
        if (!isCloudinaryConfigured()) {
          throw new GraphQLError('Cloudinary is not configured properly for image management', {
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
          });
        }

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

        // Delete associated images from Cloudinary
        for (const image of existingNews.images) {
          await deleteCloudinaryImageByUrl(image.url);
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