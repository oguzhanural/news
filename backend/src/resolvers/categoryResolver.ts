import { Category } from '../models/Category';
import { GraphQLError } from 'graphql';

export const categoryResolver = {
  Query: {
    // Get all categories
    categories: async () => {
      try {
        const categories = await Category.find().sort({ name: 1 });
        return categories;
      } catch (error: unknown) {
        throw new GraphQLError('Error fetching categories', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    }
  },

  Mutation: {
    // Create a new category
    createCategory: async (_: any, { input }: { input: { name: string } }, context: any) => {
      try {
        if (!context.userId) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        const existingCategory = await Category.findOne({ name: input.name });
        if (existingCategory) {
          throw new GraphQLError('Category already exists', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        const category = new Category(input);
        await category.save();
        return category;
      } catch (error: unknown) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        if (error instanceof Error) {
          throw new GraphQLError(`Error creating category: ${error.message}`, {
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
          });
        }
        throw new GraphQLError('Error creating category', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    // Update a category
    updateCategory: async (_: any, { id, input }: { id: string, input: { name: string } }, context: any) => {
      try {
        if (!context.userId) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        const category = await Category.findByIdAndUpdate(
          id,
          { $set: input },
          { new: true, runValidators: true }
        );

        if (!category) {
          throw new GraphQLError('Category not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        return category;
      } catch (error: unknown) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        if (error instanceof Error) {
          throw new GraphQLError(`Error updating category: ${error.message}`, {
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
          });
        }
        throw new GraphQLError('Error updating category', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    // Delete a category
    deleteCategory: async (_: any, { id }: { id: string }, context: any) => {
      try {
        if (!context.userId) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        const category = await Category.findByIdAndDelete(id);
        if (!category) {
          throw new GraphQLError('Category not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }
        return true;
      } catch (error: unknown) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        if (error instanceof Error) {
          throw new GraphQLError(`Error deleting category: ${error.message}`, {
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
          });
        }
        throw new GraphQLError('Error deleting category', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    }
  }
}; 