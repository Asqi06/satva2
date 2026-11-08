import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '', trim: true },
    image: { type: mongoose.Schema.Types.Mixed, default: '' },
    href: { type: String, default: '', trim: true },
    isFeatured: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    bg: { type: String, default: '' },
  },
  {
    timestamps: true,
    collection: 'categories',
  }
);

export const Category = mongoose.models?.Category || mongoose.model('Category', categorySchema);
