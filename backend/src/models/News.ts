import mongoose, { Schema, Document } from 'mongoose';
import slugify from 'slugify';

export interface INews extends Document {
  title: string;
  slug: string;
  content: string;
  summary?: string;
  imageUrl?: string;
  category: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  publishDate: Date;
  updatedAt: Date;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  tags: string[];
}

const NewsSchema = new Schema<INews>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    maxlength: 500
  },
  imageUrl: String,
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    default: 'DRAFT'
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Create slug from title before saving
NewsSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true });
  }
  next();
});

export const News = mongoose.model<INews>('News', NewsSchema); 