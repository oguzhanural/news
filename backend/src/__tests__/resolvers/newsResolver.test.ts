import mongoose from 'mongoose';
import { GraphQLError } from 'graphql';
import { newsResolver } from '../../resolvers/newsResolver';
import { News } from '../../models/News';
import { User } from '../../models/User';
import { Category } from '../../models/Category';
import { connectDB, clearDB, closeDB } from '../setup';
import { ApolloServer } from '@apollo/server';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const typeDefs = readFileSync(
  resolve(__dirname, '../../schemas/news.graphql'),
  'utf-8'
);

interface TestResponse {
  body: {
    kind: string;
    singleResult: {
      data?: {
        news?: any;
        newsList?: any[];
        searchNews?: {
          news: any[];
          total: number;
          hasMore: boolean;
        };
      };
      errors?: Array<{ message: string }>;
    };
  };
}

let testServer: ApolloServer;

interface CreateNewsInput {
  title: string;
  content: string;
  summary: string;
  images: Array<{
    url: string;
    caption?: string;
    isMain: boolean;
  }>;
  categoryId: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  tags?: string[];
}

describe('News Resolver Tests', () => {
  let userId: mongoose.Types.ObjectId;
  let categoryId: mongoose.Types.ObjectId;
  let newsId: mongoose.Types.ObjectId;
  let context: { userId: string };

  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    await clearDB();

    // Create test user
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'JOURNALIST'
    });
    userId = user._id as mongoose.Types.ObjectId;
    context = { userId: (user._id as mongoose.Types.ObjectId).toString() };

    // Create test category
    const category = await Category.create({
      name: 'Test Category',
      description: 'Test category description'
    });
    categoryId = category._id as mongoose.Types.ObjectId;

    // Create test news article
    const news = await News.create({
      title: 'Test News Article',
      content: 'Test content',
      summary: 'Test summary',
      images: [{
        url: 'https://example.com/image.jpg',
        caption: 'Test image',
        isMain: true
      }],
      category: categoryId,
      author: userId,
      status: 'DRAFT' as const,
      tags: ['test']
    });
    newsId = news._id as mongoose.Types.ObjectId;
  });

  afterAll(async () => {
    await closeDB();
  });

  describe('Query', () => {
    describe('news', () => {
      it('should return a news article by id', async () => {
        const result = await newsResolver.Query.news(null, { id: newsId.toString() });
        expect(result).toBeDefined();
        expect(result?.title).toBe('Test News Article');
      });

      it('should throw error for non-existent news', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        await expect(
          newsResolver.Query.news(null, { id: fakeId.toString() })
        ).rejects.toThrow(GraphQLError);
      });
    });

    describe('newsList', () => {
      it('should return list of news articles', async () => {
        const result = await newsResolver.Query.newsList(null, {});
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(1);
      });

      it('should filter by category', async () => {
        const result = await newsResolver.Query.newsList(null, { 
          category: categoryId.toString() 
        });
        expect(result.length).toBe(1);
      });

      it('should filter by status', async () => {
        const result = await newsResolver.Query.newsList(null, { 
          status: 'DRAFT' 
        });
        expect(result.length).toBe(1);
      });
    });
  });

  describe('Mutation', () => {
    describe('createNews', () => {
      it('should create a news article', async () => {
        const input: CreateNewsInput = {
          title: 'New Article',
          content: 'New content',
          summary: 'New summary',
          images: [{
            url: 'https://example.com/new.jpg',
            caption: 'New image',
            isMain: true
          }],
          categoryId: categoryId.toString(),
          status: 'DRAFT',
          tags: ['new']
        };

        const result = await newsResolver.Mutation.createNews(
          null,
          { input },
          context
        );

        expect(result).toBeDefined();
        expect(result?.title).toBe('New Article');
        expect(result?.author._id.toString()).toBe(userId.toString());
      });

      it('should throw error when not authenticated', async () => {
        const input: CreateNewsInput = {
          title: 'New Article',
          content: 'Content',
          summary: 'Summary',
          images: [{ url: 'https://example.com/img.jpg', isMain: true }],
          categoryId: categoryId.toString(),
          status: 'DRAFT'
        };

        await expect(
          newsResolver.Mutation.createNews(null, { input }, {})
        ).rejects.toThrow('Authentication required');
      });
    });

    describe('updateNews', () => {
      it('should update a news article', async () => {
        const input = {
          title: 'Updated Title',
          content: 'Updated content'
        };

        const result = await newsResolver.Mutation.updateNews(
          null,
          { id: newsId.toString(), input },
          context
        );

        expect(result?.title).toBe('Updated Title');
        expect(result?.content).toBe('Updated content');
      });

      it('should throw error when updating non-existent news', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const input = { title: 'Updated' };

        await expect(
          newsResolver.Mutation.updateNews(
            null,
            { id: fakeId.toString(), input },
            context
          )
        ).rejects.toThrow('News not found');
      });

      it('should throw error when user is not author', async () => {
        const otherUser = await User.create({
          name: 'Other User',
          email: 'other@example.com',
          password: 'password123',
          role: 'JOURNALIST'
        });

        const input = { title: 'Updated' };
        const otherContext = { userId: (otherUser._id as mongoose.Types.ObjectId).toString() };

        await expect(
          newsResolver.Mutation.updateNews(
            null,
            { id: newsId.toString(), input },
            otherContext
          )
        ).rejects.toThrow('Not authorized to update this news');
      });
    });
  });

  describe('Search', () => {
    beforeEach(async () => {
      // Create test news articles
      await News.create([
        {
          title: 'Technology News',
          content: 'Latest developments in AI and Machine Learning',
          summary: 'AI advances',
          author: userId,
          category: categoryId,
          status: 'PUBLISHED',
          tags: ['technology', 'ai'],
          images: [{ url: 'image1.jpg', isMain: true }]
        },
        {
          title: 'Sports Update',
          content: 'World Cup Finals Results',
          summary: 'Sports results',
          author: userId,
          category: categoryId,
          status: 'PUBLISHED',
          tags: ['sports', 'worldcup'],
          images: [{ url: 'image2.jpg', isMain: true }]
        },
        {
          title: 'Technology Review',
          content: 'New smartphone releases',
          summary: 'Tech review',
          author: userId,
          category: categoryId,
          status: 'DRAFT',
          tags: ['technology', 'smartphones'],
          images: [{ url: 'image3.jpg', isMain: true }]
        }
      ]);
    });

    it('should search news articles by text', async () => {
      const query = `
        query {
          searchNews(input: {
            query: "technology"
          }) {
            news {
              title
              content
            }
            total
            hasMore
          }
        }
      `;

      const response = await testServer.executeOperation({ query }) as TestResponse;

      expect(response.body.kind).toBe('single');
      const data = response.body.singleResult.data?.searchNews;
      expect(data).toBeDefined();
      expect(data?.news).toHaveLength(2);
      expect(data?.total).toBe(2);
      expect(data?.hasMore).toBe(false);
      expect(data?.news[0].title).toMatch(/Technology/);
    });

    it('should filter search results by status', async () => {
      const query = `
        query {
          searchNews(input: {
            query: "technology"
            status: PUBLISHED
          }) {
            news {
              title
              status
            }
            total
          }
        }
      `;

      const response = await testServer.executeOperation({ query }) as TestResponse;

      expect(response.body.kind).toBe('single');
      const data = response.body.singleResult.data?.searchNews;
      expect(data).toBeDefined();
      expect(data?.news).toHaveLength(1);
      expect(data?.total).toBe(1);
      expect(data?.news[0].status).toBe('PUBLISHED');
    });

    it('should filter search results by tags', async () => {
      const query = `
        query {
          searchNews(input: {
            query: "technology"
            tags: ["smartphones"]
          }) {
            news {
              title
              tags
            }
            total
          }
        }
      `;

      const response = await testServer.executeOperation({ query }) as TestResponse;

      expect(response.body.kind).toBe('single');
      const data = response.body.singleResult.data?.searchNews;
      expect(data).toBeDefined();
      expect(data?.news).toHaveLength(1);
      expect(data?.total).toBe(1);
      expect(data?.news[0].tags).toContain('smartphones');
    });

    it('should handle pagination in search results', async () => {
      const query = `
        query {
          searchNews(input: {
            query: "technology"
            limit: 1
            offset: 0
          }) {
            news {
              title
            }
            hasMore
            total
          }
        }
      `;

      const response = await testServer.executeOperation({ query }) as TestResponse;

      expect(response.body.kind).toBe('single');
      const data = response.body.singleResult.data?.searchNews;
      expect(data).toBeDefined();
      expect(data?.news).toHaveLength(1);
      expect(data?.total).toBe(2);
      expect(data?.hasMore).toBe(true);
    });
  });
}); 