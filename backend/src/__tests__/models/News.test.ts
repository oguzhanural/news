import mongoose from 'mongoose';
import { News } from '../../models/News';
import { User } from '../../models/User';
import { Category } from '../../models/Category';
import { connectDB, clearDB, closeDB } from '../setup';

describe('News Model Tests', () => {
  let userId: mongoose.Types.ObjectId;
  let categoryId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    await clearDB();
    
    // Create a test user and category for reference
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'JOURNALIST'
    });
    userId = user._id as mongoose.Types.ObjectId;

    const category = await Category.create({
      name: 'Test Category',
      description: 'Test category description'
    });
    categoryId = category._id as mongoose.Types.ObjectId;
  });

  afterAll(async () => {
    await closeDB();
  });

  it('should create a valid news article', async () => {
    const validNews = {
      title: 'Test News Article',
      content: 'This is test content',
      summary: 'Test summary',
      images: [{
        url: 'https://example.com/image.jpg',
        caption: 'Test image',
        isMain: true
      }],
      category: categoryId,
      author: userId,
      status: 'DRAFT' as const,
      tags: ['test', 'news']
    };

    const news = await News.create(validNews);
    expect(news._id).toBeDefined();
    expect(news.slug).toBe('test-news-article');
    expect(news.status).toBe('DRAFT');
    expect(news.createdAt).toBeDefined();
    expect(news.updatedAt).toBeDefined();
  });

  it('should require at least one image', async () => {
    const newsWithNoImages = {
      title: 'Test News',
      content: 'Content',
      summary: 'Summary',
      images: [],
      category: categoryId,
      author: userId,
      status: 'DRAFT' as const
    };

    await expect(News.create(newsWithNoImages)).rejects.toThrow();
  });

  it('should require exactly one main image', async () => {
    const newsWithTwoMainImages = {
      title: 'Test News',
      content: 'Content',
      summary: 'Summary',
      images: [
        { url: 'https://example.com/1.jpg', isMain: true },
        { url: 'https://example.com/2.jpg', isMain: true }
      ],
      category: categoryId,
      author: userId,
      status: 'DRAFT' as const
    };

    await expect(News.create(newsWithTwoMainImages)).rejects.toThrow();
  });

  it('should generate a unique slug from title', async () => {
    const news1 = await News.create({
      title: 'Test News Article',
      content: 'Content 1',
      summary: 'Summary 1',
      images: [{ url: 'https://example.com/1.jpg', isMain: true }],
      category: categoryId,
      author: userId,
      status: 'DRAFT' as const
    });

    const news2 = await News.create({
      title: 'Test News Article',
      content: 'Content 2',
      summary: 'Summary 2',
      images: [{ url: 'https://example.com/2.jpg', isMain: true }],
      category: categoryId,
      author: userId,
      status: 'DRAFT' as const
    });

    expect(news1.slug).toBe('test-news-article');
    expect(news2.slug).not.toBe(news1.slug);
  });

  it('should validate required fields', async () => {
    const invalidNews = {
      title: '',  // Required field
      content: 'Content',
      summary: 'Summary',
      images: [{ url: 'https://example.com/1.jpg', isMain: true }],
      category: categoryId,
      author: userId
    };

    await expect(News.create(invalidNews)).rejects.toThrow();
  });

  it('should validate status enum values', async () => {
    const newsWithInvalidStatus = {
      title: 'Test News',
      content: 'Content',
      summary: 'Summary',
      images: [{ url: 'https://example.com/1.jpg', isMain: true }],
      category: categoryId,
      author: userId,
      status: 'INVALID_STATUS'
    };

    await expect(News.create(newsWithInvalidStatus)).rejects.toThrow();
  });
}); 