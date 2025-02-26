import mongoose, { Schema, Document } from 'mongoose';
import slugify from 'slugify';

export interface INews extends Document {
  title: string;
  content: string;
  summary: string;
  slug: string;
  author: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  tags: string[];
  images: {
    url: string;
    isMain: boolean;
    caption?: string;
    altText?: string;
    credit?: string;
  }[];
  publishDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const newsSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  status: {
    type: String,
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    default: 'DRAFT'
  },
  tags: [{
    type: String,
    trim: true
  }],
  publishDate: {
    type: Date,
    default: null
  },
  images: {
    type: [{
      url: {
        type: String,
        required: true
      },
      isMain: {
        type: Boolean,
        default: false
      },
      caption: {
        type: String,
        default: ''
      },
      altText: {
        type: String,
        default: ''
      },
      credit: {
        type: String
      }
    }],
    required: true,
    validate: {
      validator: function(images: any[]) {
        // Must have at least one image
        if (!images || images.length === 0) {
          return false;
        }
        // Must have exactly one main image
        const mainImages = images.filter(img => img.isMain);
        return mainImages.length === 1;
      },
      message: 'News must have at least one image and exactly one main image'
    }
  },
}, {
  timestamps: true
});

// Create text indexes for search
newsSchema.index({ 
  title: 'text', 
  content: 'text', 
  summary: 'text',
  tags: 'text' 
});

// Middleware to generate unique slug from title
newsSchema.pre('save', async function(next) {
  if (this.isModified('title')) {
    let baseSlug = slugify(this.title, { lower: true });
    let slug = baseSlug;
    let counter = 1;
    
    // Keep trying until we find a unique slug
    while (true) {
      const existingNews = await mongoose.models.News.findOne({ 
        _id: { $ne: this._id }, // Exclude current document
        slug: slug 
      });
      
      if (!existingNews) {
        this.slug = slug;
        break;
      }
      
      // If exists, try with counter
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
  
  // Set publishDate if status is PUBLISHED and publishDate is not set
  if (this.isModified('status') && this.status === 'PUBLISHED' && !this.publishDate) {
    this.publishDate = new Date();
  }
  
  next();
});

// Validate that exactly one image is marked as main
newsSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    const mainImages = this.images.filter(img => img.isMain);
    if (mainImages.length !== 1) {
      next(new Error('Exactly one image must be marked as main'));
    }
  }
  next();
});

export const News = mongoose.model<INews>('News', newsSchema); 