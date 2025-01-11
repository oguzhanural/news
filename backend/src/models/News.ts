import mongoose, { Schema, Document } from 'mongoose';
import slugify from 'slugify';

interface IImage {
  url: string;
  caption?: string;
  isMain: boolean;
}

export interface INews extends Document {
  title: string;
  slug: string;
  content: string;
  summary: string;
  images: IImage[];
  category: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  publishDate: Date | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  tags: string[];
}

const ImageSchema = new Schema({
  url: {
    type: String,
    required: true
  },
  caption: String,
  isMain: {
    type: Boolean,
    required: true
  }
}, { _id: false });

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
    required: true,
    maxlength: 500
  },
  images: {
    type: [ImageSchema],
    required: true,
    validate: {
      validator: function(images: IImage[]) {
        // Must have at least one image
        if (images.length === 0) return false;
        // Must have exactly one main image
        const mainImages = images.filter(img => img.isMain);
        return mainImages.length === 1;
      },
      message: 'News must have at least one image and exactly one main image'
    }
  },
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
    default: null
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