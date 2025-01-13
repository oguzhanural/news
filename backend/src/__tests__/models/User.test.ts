import { User } from '../../models/User';
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

describe('User Model Test', () => {
  const validUserData = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'JOURNALIST' as const
  };

  it('should create & save user successfully', async () => {
    const validUser = new User(validUserData);
    const savedUser = await validUser.save();
    
    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe(validUserData.name);
    expect(savedUser.email).toBe(validUserData.email);
    expect(savedUser.role).toBe(validUserData.role);
    expect(savedUser.password).not.toBe(validUserData.password); // Should be hashed
  }, 10000);

  it('should fail to save user without required fields', async () => {
    const userWithoutRequiredField = new User({});
    let err;
    
    try {
      await userWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  }, 10000);

  it('should fail to save user with invalid email', async () => {
    const userWithInvalidEmail = new User({
      ...validUserData,
      email: 'invalid-email'
    });
    let err;
    
    try {
      await userWithInvalidEmail.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  }, 10000);

  it('should fail to save user with invalid role', async () => {
    const userWithInvalidRole = new User({
      ...validUserData,
      role: 'INVALID_ROLE'
    });
    let err;
    
    try {
      await userWithInvalidRole.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  }, 10000);

  it('should prevent duplicate email addresses', async () => {
    await User.create(validUserData);
    const userWithDuplicateEmail = new User(validUserData);
    
    let err: any;
    try {
      await userWithDuplicateEmail.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeDefined();
    expect(err.code).toBe(11000);
  }, 10000);

  it('should correctly compare passwords', async () => {
    const user = await User.create(validUserData);
    
    const isMatch = await user.comparePassword(validUserData.password);
    const isNotMatch = await user.comparePassword('wrongpassword');
    
    expect(isMatch).toBe(true);
    expect(isNotMatch).toBe(false);
  }, 10000);

  it('should hash password before saving', async () => {
    const user = await User.create(validUserData);
    
    expect(user.password).not.toBe(validUserData.password);
    expect(user.password).toHaveLength(60); // bcrypt hash length
  }, 10000);

  it('should not rehash password if not modified', async () => {
    const user = await User.create(validUserData);
    const firstHash = user.password;
    
    user.name = 'Jane Doe';
    await user.save();
    
    expect(user.password).toBe(firstHash);
  }, 10000);
}); 