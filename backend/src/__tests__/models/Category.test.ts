import { Category } from '../../models/Category';
import mongoose from 'mongoose';
import { connectDB, clearDB, closeDB } from '../setup';

beforeAll(async () => {
  await connectDB();
}, 10000);

afterEach(async () => {
  await clearDB();
}, 10000);

afterAll(async () => {
  await closeDB();
}, 10000);

describe('Category Model Test', () => {
  it('should create & save category successfully', async () => {
    const validCategory = new Category({
      name: 'Technology'
    });
    const savedCategory = await validCategory.save();
    
    expect(savedCategory._id).toBeDefined();
    expect(savedCategory.name).toBe('Technology');
    expect(savedCategory.slug).toBe('technology');
  });

  it('should fail to save category without required fields', async () => {
    const categoryWithoutName = new Category({});
    let err;
    
    try {
      await categoryWithoutName.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  });

  it('should generate slug from name', async () => {
    const category = new Category({
      name: 'Science & Technology'
    });
    const savedCategory = await category.save();
    
    expect(savedCategory.slug).toBe('science-and-technology');
  });

  it('should prevent duplicate category names', async () => {
    await new Category({ name: 'Sports' }).save();
    const duplicateCategory = new Category({ name: 'Sports' });
    
    let err: any;
    try {
      await duplicateCategory.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // MongoDB duplicate key error code
  });
}); 