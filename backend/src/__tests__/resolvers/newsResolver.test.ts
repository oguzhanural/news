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

const typeDefs = [
  readFileSync(resolve(__dirname, '../../schemas/news.graphql'), 'utf-8'),
  readFileSync(resolve(__dirname, '../../schemas/user.graphql'), 'utf-8'),
  readFileSync(resolve(__dirname, '../../schemas/category.graphql'), 'utf-8')
];

interface NewsDocument extends mongoose.Document {
  title: string;
  content: string;
  summary: string;
  slug: string;
  status: string;
  tags: string[];
  createdAt: string;
  category: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  images: Array<{
    url: string;
    isMain: boolean;
  }>;
}

interface NewsListResult {
  news: NewsDocument[];
  total: number;
  hasMore: boolean;
}

interface SearchNewsResult {
  news: Array<{
    id: string;
    title: string;
    status: string;
    tags: string[];
    createdAt: string;
  }>;
  total: number;
  hasMore: boolean;
}

interface TestResponse {
  body: {
    kind: string;
    singleResult: {
      data?: {
        news?: NewsDocument;
        newsList?: NewsListResult;
        searchNews?: SearchNewsResult;
      };
      errors?: Array<{ message: string }>;
    };
  };
}

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
  let testServer: ApolloServer;

  beforeAll(async () => {
    await connectDB();
    testServer = new ApolloServer({
      typeDefs,
      resolvers: {
        Query: {
          ...newsResolver.Query
        },
        Mutation: {
          ...newsResolver.Mutation
        },
        News: {
          author: async (parent: any) => {
            return await User.findById(parent.author).select('-password');
          },
          category: async (parent: any) => {
            return await Category.findById(parent.category);
          }
        }
      }
    });
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
        expect(result).toBeDefined();
        expect(Array.isArray(result.news)).toBe(true);
        expect(result.total).toBeGreaterThanOrEqual(1);
        expect(typeof result.hasMore).toBe('boolean');
      });

      it('should filter by category', async () => {
        const result = await newsResolver.Query.newsList(null, { 
          filter: { categoryId: categoryId.toString() }
        });
        expect(result.news.length).toBeGreaterThanOrEqual(1);
        expect(result.news[0].category.toString()).toBe(categoryId.toString());
      });

      it('should filter by status', async () => {
        const result = await newsResolver.Query.newsList(null, { 
          filter: { status: 'DRAFT' }
        });
        expect(result.news.length).toBeGreaterThanOrEqual(1);
        expect(result.news[0].status).toBe('DRAFT');
      });

      it('should handle sorting', async () => {
        const result = await newsResolver.Query.newsList(null, {
          sort: {
            field: 'TITLE',
            order: 'ASC'
          }
        });
        expect(result.news.length).toBeGreaterThanOrEqual(1);
        
        // Verify sorting
        const titles = result.news.map(n => n.title) as string[];
        expect(titles.length).toBeGreaterThan(0);
        expect(titles).toEqual([...titles].sort());
      });

      it('should handle pagination', async () => {
        const result = await newsResolver.Query.newsList(null, {
          limit: 1,
          offset: 0
        });
        expect(result.news.length).toBeLessThanOrEqual(1);
        expect(result.total).toBeGreaterThanOrEqual(1);
        expect(typeof result.hasMore).toBe('boolean');
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
      // Create test data for search
      await News.create([
        {
          title: 'Technology News',
          content: 'Content about technology',
          summary: 'Tech summary',
          slug: 'technology-news',
          images: [{ url: 'test.jpg', isMain: true }],
          category: categoryId,
          author: userId,
          status: 'PUBLISHED',
          tags: ['technology', 'smartphones']
        },
        {
          title: 'Another Tech Article',
          content: 'More tech content',
          summary: 'Another tech summary',
          slug: 'another-tech-article',
          images: [{ url: 'test2.jpg', isMain: true }],
          category: categoryId,
          author: userId,
          status: 'DRAFT',
          tags: ['technology']
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
        query SearchNewsByStatus {
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
      const searchResult = response.body.singleResult.data?.searchNews as SearchNewsResult;
      
      expect(response.body.kind).toBe('single');
      expect(searchResult).toBeDefined();
      expect(searchResult.news).toHaveLength(1);
      expect(searchResult.total).toBe(1);
      expect(searchResult.news[0].status).toBe('PUBLISHED');
    });

    it('should filter search results by tags', async () => {
      const query = `
        query SearchNewsByTags {
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
      const searchResult = response.body.singleResult.data?.searchNews as SearchNewsResult;
      
      expect(response.body.kind).toBe('single');
      expect(searchResult).toBeDefined();
      expect(searchResult.news).toHaveLength(1);
      expect(searchResult.total).toBe(1);
      expect(searchResult.news[0].tags).toContain('smartphones');
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

  describe('News List', () => {
    it('should filter news by multiple criteria', async () => {
      const query = `
        query FilterNewsList($filter: NewsFilterInput) {
          newsList(filter: $filter) {
            news {
              id
              title
              status
              tags
              createdAt
            }
            total
            hasMore
          }
        }
      `;

      const variables = {
        filter: {
          status: "PUBLISHED",
          categoryId: categoryId.toString(),
          authorId: userId.toString(),
          tags: ["technology"],
          fromDate: "2024-01-01",
          toDate: "2024-12-31"
        }
      };

      const response = await testServer.executeOperation({ 
        query,
        variables
      }) as TestResponse;
      
      const listResult = response.body.singleResult.data?.newsList as NewsListResult;
      expect(response.body.kind).toBe('single');
      expect(listResult).toBeDefined();
      expect(Array.isArray(listResult.news)).toBe(true);
      expect(typeof listResult.total).toBe('number');
      expect(typeof listResult.hasMore).toBe('boolean');
    });

    it('should sort news by different fields', async () => {
      const query = `
        query {
          newsList(
            sort: {
              field: TITLE
              order: ASC
            }
            limit: 5
          ) {
            news {
              id
              title
            }
            total
            hasMore
          }
        }
      `;

      const response = await testServer.executeOperation({ query }) as TestResponse;
      
      expect(response.body.kind).toBe('single');
      const data = response.body.singleResult.data?.newsList;
      expect(data).toBeDefined();
      expect(Array.isArray(data?.news)).toBe(true);
      
      // Verify sorting
      if (data && data.news) {
        const titles = data.news.map(n => n.title);
        const sortedTitles = Array.from(titles).sort();
        expect(titles).toEqual(sortedTitles);
      }
    });

    it('should filter news by date range', async () => {
      const query = `
        query {
          newsList(
            filter: {
              fromDate: "2024-01-01"
              toDate: "2024-12-31"
            }
          ) {
            news {
              id
              createdAt
            }
            total
          }
        }
      `;

      const response = await testServer.executeOperation({ query }) as TestResponse;
      
      expect(response.body.kind).toBe('single');
      const data = response.body.singleResult.data?.newsList;
      expect(data).toBeDefined();
      
      // Verify date filtering
      data?.news.forEach(news => {
        if (news.createdAt) {
          const createdAt = new Date(news.createdAt);
          expect(createdAt.getTime()).toBeGreaterThanOrEqual(new Date('2024-01-01').getTime());
          expect(createdAt.getTime()).toBeLessThanOrEqual(new Date('2024-12-31').getTime());
        }
      });
    });
  });
}); 