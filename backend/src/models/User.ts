import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'EDITOR' | 'JOURNALIST' | 'ADMIN' | 'READER';
  registrationSource: 'PUBLIC_PORTAL' | 'ADMIN_PORTAL';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  verifyCurrentPassword(currentPassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    index: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
    validate: {
      validator: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: 'Please enter a valid email'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    validate: {
      validator: function(password: string) {
        // Password must contain at least one uppercase letter, one lowercase letter, 
        // one number, and be at least 8 characters long
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
        return passwordRegex.test(password);
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }
  },
  role: {
    type: String,
    enum: {
      values: ['EDITOR', 'JOURNALIST', 'ADMIN', 'READER'],
      message: '{VALUE} is not a valid role'
    },
    default: 'READER',
    index: true
  },
  registrationSource: {
    type: String,
    enum: {
      values: ['PUBLIC_PORTAL', 'ADMIN_PORTAL'],
      message: '{VALUE} is not a valid registration source'
    },
    required: true,
    default: 'PUBLIC_PORTAL',
    index: true
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Additional validation before hashing
    if (this.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Add method to verify current password
UserSchema.methods.verifyCurrentPassword = async function(currentPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(currentPassword, this.password);
  } catch (error) {
    return false;
  }
};

// Add compound indexes for better query performance
UserSchema.index({ email: 1, role: 1 });
UserSchema.index({ name: 1, email: 1 });
UserSchema.index({ registrationSource: 1, role: 1 });

export const User = mongoose.model<IUser>('User', UserSchema); 