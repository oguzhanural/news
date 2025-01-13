import { ApolloServer } from '@apollo/server';
import { User } from '../../models/User';
import { userResolver } from '../../resolvers/userResolver';
import { connectDB, clearDB, closeDB, createTestToken } from '../setup';
import { readFileSync } from 'fs';
import { resolve } from 'path';

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

interface TestResponse {
  body: {
    kind: string;
    singleResult: {
      data?: {
        users?: UserResponse[];
        user?: UserResponse;
        registerUser?: { user: UserResponse; token: string };
        loginUser?: { user: UserResponse; token: string };
        updateUser?: UserResponse;
        deleteUser?: boolean;
      };
      errors?: Array<{ message: string; extensions?: { code: string } }>;
    };
  };
}

describe('User Resolver Tests', () => {
  let testServer: ApolloServer;
  let adminUser: any;
  let regularUser: any;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    await connectDB();
    testServer = new ApolloServer({
      typeDefs,
      resolvers: { Query: userResolver.Query, Mutation: userResolver.Mutation }
    });
  }, 10000);

  afterAll(async () => {
    await closeDB();
  }, 10000);

  beforeEach(async () => {
    await clearDB();
    // Create an admin user for testing
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'ADMIN'
    });
    adminToken = createTestToken(adminUser._id.toString());

    // Create a regular user for testing
    regularUser = await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'password123',
      role: 'JOURNALIST'
    });
    userToken = createTestToken(regularUser._id.toString());
  }, 10000);

  describe('Queries', () => {
    it('should fetch all users when authenticated as admin', async () => {
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
      expect(data?.users).toHaveLength(2);
    }, 10000);

    it('should fail to fetch users without admin role', async () => {
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
            userId: regularUser._id.toString()
          }
        }
      ) as TestResponse;

      expect(response.body.kind).toBe('single');
      expect(response.body.singleResult.errors?.[0].message).toBe('Not authorized');
    }, 10000);
  });

  describe('Mutations', () => {
    it('should register a new user', async () => {
      const mutation = `
        mutation {
          registerUser(input: {
            name: "New User"
            email: "new@example.com"
            password: "password123"
          }) {
            user {
              name
              email
              role
            }
            token
          }
        }
      `;

      const response = await testServer.executeOperation({ query: mutation }) as TestResponse;

      expect(response.body.kind).toBe('single');
      const data = response.body.singleResult.data;
      expect(data?.registerUser?.user.name).toBe('New User');
      expect(data?.registerUser?.user.email).toBe('new@example.com');
      expect(data?.registerUser?.user.role).toBe('JOURNALIST');
      expect(data?.registerUser?.token).toBeDefined();
    }, 10000);

    it('should fail to register user with existing email', async () => {
      const mutation = `
        mutation {
          registerUser(input: {
            name: "Another User"
            email: "admin@example.com"
            password: "password123"
          }) {
            user {
              name
              email
            }
            token
          }
        }
      `;

      const response = await testServer.executeOperation({ query: mutation }) as TestResponse;

      expect(response.body.kind).toBe('single');
      expect(response.body.singleResult.errors?.[0].message).toBe('User already exists with this email');
    }, 10000);

    it('should login user with correct credentials', async () => {
      const mutation = `
        mutation {
          loginUser(input: {
            email: "user@example.com"
            password: "password123"
          }) {
            user {
              name
              email
              role
            }
            token
          }
        }
      `;

      const response = await testServer.executeOperation({ query: mutation }) as TestResponse;

      expect(response.body.kind).toBe('single');
      const data = response.body.singleResult.data;
      expect(data?.loginUser?.user.email).toBe('user@example.com');
      expect(data?.loginUser?.token).toBeDefined();
    }, 10000);

    it('should fail to login with incorrect password', async () => {
      const mutation = `
        mutation {
          loginUser(input: {
            email: "user@example.com"
            password: "wrongpassword"
          }) {
            user {
              email
            }
            token
          }
        }
      `;

      const response = await testServer.executeOperation({ query: mutation }) as TestResponse;

      expect(response.body.kind).toBe('single');
      expect(response.body.singleResult.errors?.[0].message).toBe('Invalid credentials');
    }, 10000);

    it('should update user when authenticated', async () => {
      const mutation = `
        mutation {
          updateUser(id: "${regularUser._id}", input: { name: "Updated Name" }) {
            name
            email
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
      const data = response.body.singleResult.data;
      expect(data?.updateUser?.name).toBe('Updated Name');
    }, 10000);

    it('should fail to update other user without admin role', async () => {
      const mutation = `
        mutation {
          updateUser(id: "${adminUser._id}", input: { name: "Hacked Name" }) {
            name
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
      expect(response.body.singleResult.errors?.[0].message).toBe('Not authorized');
    }, 10000);

    it('should delete user when authenticated as admin', async () => {
      const mutation = `
        mutation {
          deleteUser(id: "${regularUser._id}")
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
      const data = response.body.singleResult.data;
      expect(data?.deleteUser).toBe(true);

      const deletedUser = await User.findById(regularUser._id);
      expect(deletedUser).toBeNull();
    }, 10000);

    it('should allow user to delete their own profile', async () => {
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
      const data = response.body.singleResult.data;
      expect(data?.deleteUser).toBe(true);
    }, 10000);

    it('should prevent non-admin user from deleting other users', async () => {
      const mutation = `
        mutation {
          deleteUser(id: "${adminUser._id}")
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
      expect(response.body.singleResult.errors?.[0].message).toBe('Not authorized');
    }, 10000);
  });

  describe('Role-based Update Permissions', () => {
    it('should allow admin to update any user\'s all fields', async () => {
      const mutation = `
        mutation {
          updateUser(id: "${regularUser._id}", input: {
            name: "Updated By Admin",
            role: EDITOR
          }) {
            name
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
      const data = response.body.singleResult.data;
      expect(data?.updateUser?.name).toBe('Updated By Admin');
      expect(data?.updateUser?.role).toBe('EDITOR');
    }, 10000);

    it('should allow non-admin user to update their own basic information', async () => {
      const mutation = `
        mutation {
          updateUser(id: "${regularUser._id}", input: {
            name: "Self Updated"
          }) {
            name
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
      const data = response.body.singleResult.data;
      expect(data?.updateUser?.name).toBe('Self Updated');
      expect(data?.updateUser?.role).toBe('JOURNALIST');
    }, 10000);

    it('should prevent non-admin user from updating their role', async () => {
      const mutation = `
        mutation {
          updateUser(id: "${regularUser._id}", input: {
            role: ADMIN
          }) {
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
      expect(response.body.singleResult.errors?.[0].message).toBe('Not authorized to update role');
    }, 10000);

    it('should prevent non-admin user from updating other users', async () => {
      const mutation = `
        mutation {
          updateUser(id: "${adminUser._id}", input: {
            name: "Hacked Admin"
          }) {
            name
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
      expect(response.body.singleResult.errors?.[0].message).toBe('Not authorized');
    }, 10000);
  });
}); 