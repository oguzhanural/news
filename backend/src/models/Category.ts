import mongoose, { Schema, Document } from 'mongoose';
import slugify from 'slugify';

export interface ICategory extends Document {
  name: string;
  slug: string;
}

const CategorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    index: true
  },
  slug: {
    type: String,
    unique: true,
    index: true
  }
}, {
  timestamps: true
});

// Create slug from name before saving
CategorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { 
      lower: true,
      strict: true,
      trim: true
    });
  }
  next();
});

// Add compound index for better query performance
CategorySchema.index({ name: 1, slug: 1 });

export const Category = mongoose.model<ICategory>('Category', CategorySchema); 