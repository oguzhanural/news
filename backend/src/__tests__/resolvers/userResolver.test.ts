import { ApolloServer } from '@apollo/server';
import { User } from '../../models/User';
import { userResolver } from '../../resolvers/userResolver';
import { createTestToken } from '../setup';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { IUser } from '../../models/User';
import mongoose, { Document, Types } from 'mongoose';

const typeDefs = readFileSync(
  resolve(__dirname, '../../schemas/user.graphql'),
  'utf-8'
);

interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthResponse {
  token: string;
  user: UserResponse;
}

interface TestResponse {
  body: {
    kind: string;
    singleResult: {
      data?: {
        users?: UserResponse[];
        user?: UserResponse;
        registerUser?: AuthResponse;
        loginUser?: AuthResponse;
        updateUser?: UserResponse;
        deleteUser?: boolean;
      };
      errors?: Array<{ message: string; extensions?: { code: string } }>;
    };
  };
}

type UserDocument = Document<unknown, {}, IUser> & Omit<IUser, '_id'> & {
  _id: Types.ObjectId;
};

describe('User Resolver Tests', () => {
  let testServer: ApolloServer;
  let adminUser: UserDocument;
  let adminToken: string;

  beforeAll(async () => {
    testServer = new ApolloServer({
      typeDefs,
      resolvers: { Query: userResolver.Query, Mutation: userResolver.Mutation }
    });
  });

  beforeEach(async () => {
    // Create an admin user for testing
    const user = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'ADMIN'
    });
    adminUser = user as UserDocument;
    adminToken = createTestToken(adminUser._id.toString());
  });

  describe('Queries', () => {
    it('should fetch all users when authenticated as admin', async () => {
      // Create additional test users
      await User.create([
        {
          name: 'John Editor',
          email: 'editor@example.com',
          password: 'password123',
          role: 'EDITOR'
        },
        {
          name: 'Jane Journalist',
          email: 'journalist@example.com',
          password: 'password123',
          role: 'JOURNALIST'
        }
      ]);

      const query = `
        query {
          users {
            id
            name
            email
            role
          }
        }
      `;

      const response = await testServer.executeOperation(
        { query },
        {
          contextValue: {
            userId: adminUser._id.toString()
          }
        }
      ) as TestResponse;

      expect(response.body.kind).toBe('single');
      const data = response.body.singleResult.data;
      expect(data?.users).toHaveLength(3); // Including admin user
    });

    it('should fail to fetch users without admin role', async () => {
      const user = await User.create({
        name: 'Normal User',
        email: 'user@example.com',
        password: 'password123',
        role: 'JOURNALIST'
      });
      const normalUser = user as UserDocument;

      const query = `
        query {
          users {
            id
            name
            email
            role
          }
        }
      `;

      const response = await testServer.executeOperation(
        { query },
        {
          contextValue: {
            userId: normalUser._id.toString()
          }
        }
      ) as TestResponse;

      expect(response.body.kind).toBe('single');
      expect(response.body.singleResult.errors?.[0].message).toBe('Admin access required');
      expect(response.body.singleResult.errors?.[0].extensions?.code).toBe('FORBIDDEN');
    });
  });

  describe('Mutations', () => {
    it('should register a new user', async () => {
      const mutation = `
        mutation {
          registerUser(input: {
            name: "New User"
            email: "newuser@example.com"
            password: "password123"
            role: JOURNALIST
          }) {
            token
            user {
              name
              email
              role
            }
          }
        }
      `;

      const response = await testServer.executeOperation({ query: mutation }) as TestResponse;

      expect(response.body.kind).toBe('single');
      const data = response.body.singleResult.data?.registerUser;
      expect(data?.token).toBeDefined();
      expect(data?.user.name).toBe('New User');
      expect(data?.user.email).toBe('newuser@example.com');
      expect(data?.user.role).toBe('JOURNALIST');
    });

    it('should fail to register user with existing email', async () => {
      const mutation = `
        mutation {
          registerUser(input: {
            name: "Duplicate User"
            email: "admin@example.com"
            password: "password123"
            role: JOURNALIST
          }) {
            token
            user {
              name
              email
              role
            }
          }
        }
      `;

      const response = await testServer.executeOperation({ query: mutation }) as TestResponse;

      expect(response.body.kind).toBe('single');
      expect(response.body.singleResult.errors?.[0].message).toBe('User already exists with this email');
      expect(response.body.singleResult.errors?.[0].extensions?.code).toBe('BAD_USER_INPUT');
    });

    it('should login user with correct credentials', async () => {
      const mutation = `
        mutation {
          loginUser(input: {
            email: "admin@example.com"
            password: "admin123"
          }) {
            token
            user {
              name
              email
              role
            }
          }
        }
      `;

      const response = await testServer.executeOperation({ query: mutation }) as TestResponse;

      expect(response.body.kind).toBe('single');
      const data = response.body.singleResult.data?.loginUser;
      expect(data?.token).toBeDefined();
      expect(data?.user.email).toBe('admin@example.com');
      expect(data?.user.role).toBe('ADMIN');
    });

    it('should fail to login with incorrect password', async () => {
      const mutation = `
        mutation {
          loginUser(input: {
            email: "admin@example.com"
            password: "wrongpassword"
          }) {
            token
            user {
              name
              email
              role
            }
          }
        }
      `;

      const response = await testServer.executeOperation({ query: mutation }) as TestResponse;

      expect(response.body.kind).toBe('single');
      expect(response.body.singleResult.errors?.[0].message).toBe('Invalid credentials');
      expect(response.body.singleResult.errors?.[0].extensions?.code).toBe('UNAUTHENTICATED');
    });

    it('should update user when authenticated', async () => {
      const mutation = `
        mutation {
          updateUser(id: "${adminUser._id}", input: {
            name: "Updated Admin"
            email: "updated@example.com"
          }) {
            name
            email
            role
          }
        }
      `;

      const response = await testServer.executeOperation(
        { query: mutation },
        {
          contextValue: {
            userId: adminUser._id.toString()
          }
        }
      ) as TestResponse;

      expect(response.body.kind).toBe('single');
      const data = response.body.singleResult.data?.updateUser;
      expect(data?.name).toBe('Updated Admin');
      expect(data?.email).toBe('updated@example.com');
    });

    it('should fail to update other user without admin role', async () => {
      const user = await User.create({
        name: 'Normal User',
        email: 'normal@example.com',
        password: 'password123',
        role: 'JOURNALIST'
      });
      const normalUser = user as UserDocument;

      const mutation = `
        mutation {
          updateUser(id: "${adminUser._id}", input: {
            name: "Hacked Admin"
          }) {
            name
            email
            role
          }
        }
      `;

      const response = await testServer.executeOperation(
        { query: mutation },
        {
          contextValue: {
            userId: normalUser._id.toString()
          }
        }
      ) as TestResponse;

      expect(response.body.kind).toBe('single');
      expect(response.body.singleResult.errors?.[0].message).toBe('Not authorized to update this user');
      expect(response.body.singleResult.errors?.[0].extensions?.code).toBe('FORBIDDEN');
    });

    it('should delete user when authenticated as admin', async () => {
      const user = await User.create({
        name: 'To Delete',
        email: 'delete@example.com',
        password: 'password123',
        role: 'JOURNALIST'
      });
      const userToDelete = user as UserDocument;

      const mutation = `
        mutation {
          deleteUser(id: "${userToDelete._id}")
        }
      `;

      const response = await testServer.executeOperation(
        { query: mutation },
        {
          contextValue: {
            userId: adminUser._id.toString()
          }
        }
      ) as TestResponse;

      expect(response.body.kind).toBe('single');
      expect(response.body.singleResult.data?.deleteUser).toBe(true);

      const deletedUser = await User.findById(userToDelete._id);
      expect(deletedUser).toBeNull();
    });

    it('should allow user to delete their own profile', async () => {
      // Create a regular user
      const user = await User.create({
        name: 'Self Delete User',
        email: 'selfdelete@example.com',
        password: 'password123',
        role: 'JOURNALIST'
      });
      const regularUser = user as UserDocument;

      const mutation = `
        mutation {
          deleteUser(id: "${regularUser._id}")
        }
      `;

      const response = await testServer.executeOperation(
        { query: mutation },
        {
          contextValue: {
            userId: regularUser._id.toString()
          }
        }
      ) as TestResponse;

      expect(response.body.kind).toBe('single');
      expect(response.body.singleResult.data?.deleteUser).toBe(true);

      const deletedUser = await User.findById(regularUser._id);
      expect(deletedUser).toBeNull();
    });

    it('should prevent non-admin user from deleting other users', async () => {
      // Create two regular users
      const user1 = await User.create({
        name: 'User One',
        email: 'user1@example.com',
        password: 'password123',
        role: 'JOURNALIST'
      });
      const user2 = await User.create({
        name: 'User Two',
        email: 'user2@example.com',
        password: 'password123',
        role: 'JOURNALIST'
      });
      const regularUser1 = user1 as UserDocument;
      const regularUser2 = user2 as UserDocument;

      const mutation = `
        mutation {
          deleteUser(id: "${regularUser2._id}")
        }
      `;

      const response = await testServer.executeOperation(
        { query: mutation },
        {
          contextValue: {
            userId: regularUser1._id.toString()
          }
        }
      ) as TestResponse;

      expect(response.body.kind).toBe('single');
      expect(response.body.singleResult.errors?.[0].message).toBe('Not authorized to delete this user');
      expect(response.body.singleResult.errors?.[0].extensions?.code).toBe('FORBIDDEN');

      // Verify user2 was not deleted
      const notDeletedUser = await User.findById(regularUser2._id);
      expect(notDeletedUser).not.toBeNull();
    });
  });

  describe('Role-based Update Permissions', () => {
    it('should allow admin to update any user\'s all fields', async () => {
      // Create a regular user
      const user = await User.create({
        name: 'Regular User',
        email: 'regular@example.com',
        password: 'password123',
        role: 'JOURNALIST'
      });
      const regularUser = user as UserDocument;

      const mutation = `
        mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
          updateUser(id: $id, input: $input) {
            name
            email
            role
          }
        }
      `;

      const variables = {
        id: regularUser._id.toString(),
        input: {
          name: "Updated By Admin",
          email: "updated@example.com",
          role: "EDITOR",
          password: "newpassword123"
        }
      };

      const response = await testServer.executeOperation(
        { 
          query: mutation,
          variables
        },
        {
          contextValue: {
            userId: adminUser._id.toString()
          }
        }
      ) as TestResponse;

      expect(response.body.kind).toBe('single');
      const data = response.body.singleResult.data?.updateUser;
      expect(data?.name).toBe('Updated By Admin');
      expect(data?.email).toBe('updated@example.com');
      expect(data?.role).toBe('EDITOR');
    });

    it('should allow non-admin user to update their own basic information', async () => {
      // Create a regular user
      const user = await User.create({
        name: 'Regular User',
        email: 'regular@example.com',
        password: 'password123',
        role: 'JOURNALIST'
      });
      const regularUser = user as UserDocument;

      const mutation = `
        mutation {
          updateUser(id: "${regularUser._id}", input: {
            name: "Updated Name"
            email: "newemail@example.com"
            password: "newpassword123"
          }) {
            name
            email
            role
          }
        }
      `;

      const response = await testServer.executeOperation(
        { query: mutation },
        {
          contextValue: {
            userId: regularUser._id.toString()
          }
        }
      ) as TestResponse;

      expect(response.body.kind).toBe('single');
      const data = response.body.singleResult.data?.updateUser;
      expect(data?.name).toBe('Updated Name');
      expect(data?.email).toBe('newemail@example.com');
      expect(data?.role).toBe('JOURNALIST'); // Role should remain unchanged
    });

    it('should prevent non-admin user from updating their role', async () => {
      // Create a regular user
      const user = await User.create({
        name: 'Regular User',
        email: 'regular@example.com',
        password: 'password123',
        role: 'JOURNALIST'
      });
      const regularUser = user as UserDocument;

      const mutation = `
        mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
          updateUser(id: $id, input: $input) {
            name
            role
          }
        }
      `;

      const variables = {
        id: regularUser._id.toString(),
        input: {
          name: "Updated Name",
          role: "ADMIN"
        }
      };

      const response = await testServer.executeOperation(
        { 
          query: mutation,
          variables
        },
        {
          contextValue: {
            userId: regularUser._id.toString()
          }
        }
      ) as TestResponse;

      expect(response.body.kind).toBe('single');
      expect(response.body.singleResult.errors?.[0].message).toBe('Not authorized to update role');
      expect(response.body.singleResult.errors?.[0].extensions?.code).toBe('FORBIDDEN');
    });

    it('should prevent non-admin user from updating other users', async () => {
      // Create two regular users
      const user1 = await User.create({
        name: 'User One',
        email: 'user1@example.com',
        password: 'password123',
        role: 'JOURNALIST'
      });
      const user2 = await User.create({
        name: 'User Two',
        email: 'user2@example.com',
        password: 'password123',
        role: 'JOURNALIST'
      });
      const regularUser1 = user1 as UserDocument;
      const regularUser2 = user2 as UserDocument;

      const mutation = `
        mutation {
          updateUser(id: "${regularUser2._id}", input: {
            name: "Hacked Name"
          }) {
            name
            email
          }
        }
      `;

      const response = await testServer.executeOperation(
        { query: mutation },
        {
          contextValue: {
            userId: regularUser1._id.toString()
          }
        }
      ) as TestResponse;

      expect(response.body.kind).toBe('single');
      expect(response.body.singleResult.errors?.[0].message).toBe('Not authorized to update this user');
      expect(response.body.singleResult.errors?.[0].extensions?.code).toBe('FORBIDDEN');
    });
  });
}); 