import { User } from '../models/User';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import bcrypt from 'bcryptjs';

interface UserInput {
  name: string;
  email: string;
  password: string;
  role?: 'EDITOR' | 'JOURNALIST' | 'ADMIN' | 'READER';
  registrationSource: 'PUBLIC_PORTAL' | 'ADMIN_PORTAL';
}

interface LoginUserInput {
  email: string;
  password: string;
}

interface UpdateRoleInput {
  userId: string;
  role: 'EDITOR' | 'JOURNALIST' | 'ADMIN' | 'READER';
}

interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
}

interface Context {
  userId: string | null;
}

const validateAdminAccess = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user || user.role !== 'ADMIN') {
    throw new GraphQLError('Admin access required', {
      extensions: { code: 'FORBIDDEN' }
    });
  }
  return user;
};

export const userResolver = {
  Query: {
    // Get current user
    me: async (_: any, __: any, context: any) => {
      try {
        if (!context.userId) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        const user = await User.findById(context.userId).select('-password');
        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }
        return user;
      } catch (error: unknown) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Error fetching user profile', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    // Get user by ID (admin only)
    user: async (_: any, { id }: { id: string }, context: any) => {
      try {
        await validateAdminAccess(context.userId);
        const user = await User.findById(id).select('-password');
        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }
        return user;
      } catch (error: unknown) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Error fetching user', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    // Get all users (admin only)
    users: async (_: any, { role }: { role?: string }, context: any) => {
      try {
        await validateAdminAccess(context.userId);
        const query = role ? { role } : {};
        const users = await User.find(query).select('-password');
        return users;
      } catch (error: unknown) {
        if (error instanceof GraphQLError) throw error;
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

        // Set role based on registration source
        let role = input.role;
        if (input.registrationSource === 'PUBLIC_PORTAL') {
          role = 'READER';
        } else if (input.registrationSource === 'ADMIN_PORTAL' && !role) {
          throw new GraphQLError('Role is required for admin portal registration', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        const user = new User({
          ...input,
          role
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
            role: user.role,
            registrationSource: user.registrationSource,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        };
      } catch (error: unknown) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Error registering user', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    // Login user
    loginUser: async (_: any, { input }: { input: LoginUserInput }) => {
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
            role: user.role,
            registrationSource: user.registrationSource,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        };
      } catch (error: unknown) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Login error', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    // Update user (self or admin only)
    updateUser: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateUserInput },
      { userId }: Context
    ) => {
      if (!userId) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const user = await User.findById(id);
      if (!user) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      // Only allow users to update their own profile or admins to update any profile
      const requestingUser = await User.findById(userId);
      if (!requestingUser) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      if (requestingUser.role !== 'ADMIN' && userId !== id) {
        throw new GraphQLError('Not authorized to update this user', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      // If password is being updated, verify current password
      if (input.password) {
        // Current password is required for password changes
        if (!input.currentPassword) {
          throw new GraphQLError('Current password is required to change password', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        // Verify current password
        const isCurrentPasswordValid = await user.verifyCurrentPassword(input.currentPassword);
        if (!isCurrentPasswordValid) {
          throw new GraphQLError('Current password is incorrect', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        // Validate new password
        if (input.password.length < 8) {
          throw new GraphQLError('New password must be at least 8 characters long', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
        if (!passwordRegex.test(input.password)) {
          throw new GraphQLError(
            'Password must contain at least one uppercase letter, one lowercase letter, and one number',
            { extensions: { code: 'BAD_USER_INPUT' } }
          );
        }
      }

      // Remove currentPassword from input before updating
      const { currentPassword, ...updateData } = input;

      try {
        const updatedUser = await User.findByIdAndUpdate(
          id,
          { $set: updateData },
          { new: true, runValidators: true }
        );

        if (!updatedUser) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        return updatedUser;
      } catch (error) {
        if (error instanceof Error) {
          throw new GraphQLError(error.message, {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }
        throw error;
      }
    },

    // Update user role (admin only)
    updateUserRole: async (_: any, { input }: { input: UpdateRoleInput }, context: any) => {
      try {
        await validateAdminAccess(context.userId);

        const user = await User.findById(input.userId);
        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        user.role = input.role;
        await user.save();

        return user;
      } catch (error: unknown) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Error updating user role', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    // Delete user (admin only)
    deleteUser: async (_: any, { id }: { id: string }, context: any) => {
      try {
        await validateAdminAccess(context.userId);

        const result = await User.findByIdAndDelete(id);
        return !!result;
      } catch (error: unknown) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Error deleting user', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    }
  }
}; 