import { User } from '../models/User';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import bcrypt from 'bcryptjs';

interface UserInput {
  name: string;
  email: string;
  password: string;
  role?: 'EDITOR' | 'JOURNALIST' | 'ADMIN';
}

interface LoginInput {
  email: string;
  password: string;
}

export const userResolver = {
  Query: {
    // Get user by ID
    user: async (_: any, { id }: { id: string }) => {
      try {
        const user = await User.findById(id).select('-password');
        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }
        return user;
      } catch (error: unknown) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError('Error fetching user', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    // Get all users (admin only)
    users: async (_: any, __: any, context: any) => {
      try {
        if (!context.userId) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        const currentUser = await User.findById(context.userId);
        if (currentUser?.role !== 'ADMIN') {
          throw new GraphQLError('Not authorized', {
            extensions: { code: 'FORBIDDEN' }
          });
        }

        const users = await User.find().select('-password');
        return users;
      } catch (error: unknown) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError('Error fetching users', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    }
  },

  Mutation: {
    // Register new user
    registerUser: async (_: any, { input }: { input: UserInput }) => {
      try {
        const existingUser = await User.findOne({ email: input.email });
        if (existingUser) {
          throw new GraphQLError('User already exists with this email', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        // Create user with plain password - it will be hashed by the pre-save middleware
        const user = new User({
          ...input,
          role: input.role || 'JOURNALIST'
        });
        await user.save();

        const token = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        return {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        };
      } catch (error: unknown) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        if (error instanceof Error) {
          throw new GraphQLError(`Error registering user: ${error.message}`, {
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
          });
        }
        throw new GraphQLError('Error registering user', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    // Login user
    loginUser: async (_: any, { input }: { input: LoginInput }) => {
      try {
        const user = await User.findOne({ email: input.email });
        if (!user) {
          throw new GraphQLError('Invalid credentials', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        const isValidPassword = await user.comparePassword(input.password);
        if (!isValidPassword) {
          throw new GraphQLError('Invalid credentials', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        const token = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        return {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        };
      } catch (error: unknown) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        if (error instanceof Error) {
          throw new GraphQLError(`Login error: ${error.message}`, {
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
          });
        }
        throw new GraphQLError('Login error', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    // Update user
    updateUser: async (_: any, { id, input }: { id: string, input: Partial<UserInput> }, context: any) => {
      try {
        // Check authentication
        if (!context.userId) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        // Get current user
        const currentUser = await User.findById(context.userId);
        if (!currentUser) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        // Only allow users to update their own profile or admin to update any profile
        if (context.userId !== id && currentUser.role !== 'ADMIN') {
          throw new GraphQLError('Not authorized', {
            extensions: { code: 'FORBIDDEN' }
          });
        }

        // Validate role updates
        if (input.role) {
          // Only admin can update roles
          if (currentUser.role !== 'ADMIN') {
            throw new GraphQLError('Not authorized to update role', {
              extensions: { code: 'FORBIDDEN' }
            });
          }
          
          // Validate role enum value
          const validRoles = ['EDITOR', 'JOURNALIST', 'ADMIN'];
          if (!validRoles.includes(input.role)) {
            throw new GraphQLError('Invalid role value', {
              extensions: { code: 'BAD_USER_INPUT' }
            });
          }
        }

        // If password is being updated, hash it
        let updateData = { ...input };
        if (input.password) {
          const salt = await bcrypt.genSalt(10);
          updateData.password = await bcrypt.hash(input.password, salt);
        }

        const updatedUser = await User.findByIdAndUpdate(
          id,
          { $set: updateData },
          { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        return updatedUser;
      } catch (error: unknown) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        if (error instanceof Error) {
          throw new GraphQLError(`Error updating user: ${error.message}`, {
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
          });
        }
        throw new GraphQLError('Error updating user', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    // Delete user
    deleteUser: async (_: any, { id }: { id: string }, context: any) => {
      try {
        // Check authentication
        if (!context.userId) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        // Only allow users to delete their own profile or admin to delete any profile
        const currentUser = await User.findById(context.userId);
        if (context.userId !== id && currentUser?.role !== 'ADMIN') {
          throw new GraphQLError('Not authorized', {
            extensions: { code: 'FORBIDDEN' }
          });
        }

        const user = await User.findByIdAndDelete(id);
        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        return true;
      } catch (error: unknown) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        if (error instanceof Error) {
          throw new GraphQLError(`Error deleting user: ${error.message}`, {
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
          });
        }
        throw new GraphQLError('Error deleting user', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    }
  }
}; 