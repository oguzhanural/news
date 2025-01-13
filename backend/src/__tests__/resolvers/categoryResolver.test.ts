import { ApolloServer } from '@apollo/server';
import { Category } from '../../models/Category';
import { User } from '../../models/User';
import { categoryResolver } from '../../resolvers/categoryResolver';
import { connectDB, clearDB, closeDB, createTestToken } from '../setup';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const typeDefs = readFileSync(
  resolve(__dirname, '../../schemas/category.graphql'),
  'utf-8'
);

interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
}

interface TestResponse {
  body: {
    kind: string;
    singleResult: {
      data?: {
        categories?: CategoryResponse[];
        createCategory?: CategoryResponse;
        updateCategory?: CategoryResponse;
        deleteCategory?: boolean;
      };
      errors?: Array<{ message: string; extensions?: { code: string } }>;
    };
  };
}

describe('Category Resolver Tests', () => {
  let testServer: ApolloServer;
  let testUser: any;
  let testToken: string;

  beforeAll(async () => {
    await connectDB();
    testServer = new ApolloServer({
      typeDefs,
      resolvers: { Query: categoryResolver.Query, Mutation: categoryResolver.Mutation }
    });
  }, 10000);

  afterAll(async () => {
    await closeDB();
  }, 10000);

  beforeEach(async () => {
    await clearDB();
    // Create a test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'ADMIN'
    });
    testToken = createTestToken(testUser._id.toString());
  }, 10000);

  describe('Queries', () => {
    it('should fetch all categories', async () => {
      // Create test categories
      await Category.create([
        { name: 'Technology' },
        { name: 'Sports' }
      ]);

      const query = `
        query {
          categories {
            id
            name
            slug
          }
        }
      `;

      const response = await testServer.executeOperation({
        query
      }) as TestResponse;

      expect(response.body.kind).toBe('single');
      const data = response.body.singleResult.data;
      expect(data?.categories).toHaveLength(2);
      expect(data?.categories?.map(c => c.name).sort()).toEqual(['Sports', 'Technology']);
    }, 10000);
  });

  describe('Mutations', () => {
    it('should create a new category when authenticated', async () => {
      const mutation = `
        mutation {
          createCategory(input: { name: "Technology" }) {
            name
            slug
          }
        }
      `;

      const response = await testServer.executeOperation(
        { query: mutation },
        {
          contextValue: {
            userId: testUser._id.toString()
          }
        }
      ) as TestResponse;

      expect(response.body.kind).toBe('single');
      const data = response.body.singleResult.data;
      expect(data?.createCategory?.name).toBe('Technology');
      expect(data?.createCategory?.slug).toBe('technology');
    }, 10000);

    it('should fail to create category with duplicate name', async () => {
      // First, create a category
      await Category.create({ name: 'Technology' });

      const mutation = `
        mutation {
          createCategory(input: { name: "Technology" }) {
            name
            slug
          }
        }
      `;

      const response = await testServer.executeOperation(
        { query: mutation },
        {
          contextValue: {
            userId: testUser._id.toString()
          }
        }
      ) as TestResponse;

      expect(response.body.kind).toBe('single');
      expect(response.body.singleResult.errors?.[0].message).toBe('Category already exists');
      expect(response.body.singleResult.errors?.[0].extensions?.code).toBe('BAD_USER_INPUT');
    }, 10000);

    it('should fail to create category without authentication', async () => {
      const mutation = `
        mutation {
          createCategory(input: { name: "Technology" }) {
            name
            slug
          }
        }
      `;

      const response = await testServer.executeOperation({ query: mutation }) as TestResponse;

      expect(response.body.kind).toBe('single');
      expect(response.body.singleResult.errors?.[0].message).toBe('Authentication required');
    }, 10000);

    it('should update an existing category', async () => {
      const category = await Category.create({ name: 'Tech' });

      const mutation = `
        mutation {
          updateCategory(id: "${category._id}", input: { name: "Technology" }) {
            name
            slug
          }
        }
      `;

      const response = await testServer.executeOperation(
        { query: mutation },
        {
          contextValue: {
            userId: testUser._id.toString()
          }
        }
      ) as TestResponse;

      expect(response.body.kind).toBe('single');
      const data = response.body.singleResult.data;
      expect(data?.updateCategory?.name).toBe('Technology');
      expect(data?.updateCategory?.slug).toBe('technology');
    }, 10000);

    it('should delete a category', async () => {
      const category = await Category.create({ name: 'Tech' });

      const mutation = `
        mutation {
          deleteCategory(id: "${category._id}")
        }
      `;

      const response = await testServer.executeOperation(
        { query: mutation },
        {
          contextValue: {
            userId: testUser._id.toString()
          }
        }
      ) as TestResponse;

      expect(response.body.kind).toBe('single');
      const data = response.body.singleResult.data;
      expect(data?.deleteCategory).toBe(true);

      const deletedCategory = await Category.findById(category._id);
      expect(deletedCategory).toBeNull();
    }, 10000);
  });
}); 