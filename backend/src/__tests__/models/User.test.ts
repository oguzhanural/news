import { User } from '../../models/User';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

describe('User Model Test', () => {
  it('should create & save user successfully', async () => {
    const validUser = new User({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'JOURNALIST'
    });
    const savedUser = await validUser.save();
    
    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe('John Doe');
    expect(savedUser.email).toBe('john@example.com');
    expect(savedUser.role).toBe('JOURNALIST');
    // Password should be hashed
    expect(savedUser.password).not.toBe('password123');
    expect(savedUser.password.startsWith('$2a$')).toBeTruthy();
  });

  it('should fail to save user without required fields', async () => {
    const userWithoutRequiredFields = new User({
      name: 'John Doe'
    });
    
    let err: any;
    try {
      await userWithoutRequiredFields.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.email).toBeDefined();
    expect(err.errors.password).toBeDefined();
  });

  it('should fail to save user with invalid email', async () => {
    const userWithInvalidEmail = new User({
      name: 'John Doe',
      email: 'invalid-email',
      password: 'password123',
      role: 'JOURNALIST'
    });
    
    let err: any;
    try {
      await userWithInvalidEmail.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.email).toBeDefined();
  });

  it('should fail to save user with invalid role', async () => {
    const userWithInvalidRole = new User({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'INVALID_ROLE'
    });
    
    let err: any;
    try {
      await userWithInvalidRole.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.role).toBeDefined();
  });

  it('should prevent duplicate email addresses', async () => {
    // Create first user
    await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'JOURNALIST'
    });

    // Try to create second user with same email
    const duplicateUser = new User({
      name: 'Jane Doe',
      email: 'john@example.com',
      password: 'password456',
      role: 'EDITOR'
    });
    
    let err: any;
    try {
      await duplicateUser.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // MongoDB duplicate key error
  });

  it('should correctly compare passwords', async () => {
    const user = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'JOURNALIST'
    });

    const validPassword = await user.comparePassword('password123');
    const invalidPassword = await user.comparePassword('wrongpassword');

    expect(validPassword).toBe(true);
    expect(invalidPassword).toBe(false);
  });

  it('should hash password before saving', async () => {
    const user = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'JOURNALIST'
    });

    // Verify password is hashed
    expect(user.password).not.toBe('password123');
    expect(user.password.startsWith('$2a$')).toBeTruthy();
    
    // Verify we can still validate the password
    const isValid = await bcrypt.compare('password123', user.password);
    expect(isValid).toBe(true);
  });

  it('should not rehash password if not modified', async () => {
    const user = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'JOURNALIST'
    });

    const originalHash = user.password;

    // Update user without changing password
    user.name = 'Jane Doe';
    await user.save();

    expect(user.password).toBe(originalHash);
  });
}); 