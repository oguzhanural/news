import { User } from '../models/User';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';

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
          throw new Error('User not found');
        }
        return user;
      } catch (error) {
        throw new Error('Error fetching user');
      }
    },

    // Get all users (admin only)
    users: async (_: any, __: any, context: any) => {
      try {
        // TODO: Add authentication check
        const users = await User.find().select('-password');
        return users;
      } catch (error) {
        throw new Error('Error fetching users');
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

        const user = new User(input);
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
    updateUser: async (_: any, { id, input }: { id: string, input: Partial<UserInput> }) => {
      try {
        const user = await User.findByIdAndUpdate(
          id,
          { $set: input },
          { new: true, runValidators: true }
        ).select('-password');

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
    deleteUser: async (_: any, { id }: { id: string }) => {
      try {
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