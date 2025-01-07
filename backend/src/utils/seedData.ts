import { User } from '../models/User';
import { Category } from '../models/Category';
import { News } from '../models/News';
import { connectDB } from './db';

const seedCategories = async () => {
  const categories = [
    { name: 'Politics' },
    { name: 'Technology' },
    { name: 'Sports' },
    { name: 'Business' },
    { name: 'Entertainment' },
    { name: 'Science' },
    { name: 'Health' }
  ];

  try {
    await Category.deleteMany({});
    const createdCategories = await Category.create(categories);
    console.log('✅ Categories seeded successfully');
    return createdCategories;
  } catch (error: any) {
    console.error('Error seeding categories:', error.message);
    throw error;
  }
};

const seedUsers = async () => {
  const users = [
    {
      name: 'Admin User',
      email: 'admin@news.com',
      password: 'admin123',
      role: 'ADMIN'
    },
    {
      name: 'John Editor',
      email: 'editor@news.com',
      password: 'editor123',
      role: 'EDITOR'
    },
    {
      name: 'Jane Journalist',
      email: 'journalist@news.com',
      password: 'journalist123',
      role: 'JOURNALIST'
    }
  ];

  try {
    await User.deleteMany({});
    const createdUsers = await User.create(users);
    console.log('✅ Users seeded successfully');
    return createdUsers;
  } catch (error: any) {
    console.error('Error seeding users:', error.message);
    throw error;
  }
};

const seedNews = async (categories: any[], users: any[]) => {
  const news = [
    {
      title: 'New Technology Breakthrough',
      content: 'Scientists have discovered a revolutionary new technology...',
      summary: 'Major breakthrough in quantum computing',
      category: categories[1]._id, // Technology
      author: users[1]._id, // Editor
      status: 'PUBLISHED',
      tags: ['technology', 'science', 'innovation']
    },
    {
      title: 'Important Political Development',
      content: 'In a historic vote, the parliament has passed...',
      summary: 'New legislation passes with bipartisan support',
      category: categories[0]._id, // Politics
      author: users[2]._id, // Journalist
      status: 'PUBLISHED',
      tags: ['politics', 'government', 'legislation']
    },
    {
      title: 'Sports Championship Results',
      content: 'In an exciting final match...',
      summary: 'Local team wins national championship',
      category: categories[2]._id, // Sports
      author: users[2]._id, // Journalist
      status: 'PUBLISHED',
      tags: ['sports', 'championship', 'local']
    }
  ];

  try {
    await News.deleteMany({});
    const createdNews = await News.create(news);
    console.log('✅ News articles seeded successfully');
    return createdNews;
  } catch (error: any) {
    console.error('Error seeding news:', error.message);
    throw error;
  }
};

export const seedDatabase = async () => {
  try {
    await connectDB();
    
    const categories = await seedCategories();
    const users = await seedUsers();
    await seedNews(categories, users);

    console.log('🌱 Database seeded successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
}; 