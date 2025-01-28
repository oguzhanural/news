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
    minlength: [6, 'Password must be at least 6 characters']
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

// Add compound indexes for better query performance
UserSchema.index({ email: 1, role: 1 });
UserSchema.index({ name: 1, email: 1 });
UserSchema.index({ registrationSource: 1, role: 1 });

export const User = mongoose.model<IUser>('User', UserSchema); 