import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    name: { type: String },
    slug: { type: String, required: true, unique: true },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    oldPrice: { type: Number, min: 0 },
    description: { type: String, default: '' },
    category: { type: String, default: 'anti-tarnish' },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    subcategory: { type: String, default: 'necklaces' },
    material: { type: String, default: '18K Gold Plated 316L Surgical Steel' },
    image: { type: String, default: '' },
    images: [
      {
        publicId: { type: String, default: '' },
        secureUrl: { type: String, default: '' },
        alt: { type: String, default: '' },
        isThumbnail: { type: Boolean, default: false },
      },
    ],
    tags: [{ type: String }],
    colors: [{ type: String }],
    rating: { type: Number, default: 4.8 },
    ratingAverage: { type: Number, default: 4.8 },
    reviewsCount: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    stock: { type: Number, default: 10 },
    stockQuantity: { type: Number, default: 10 },
    sku: { type: String, default: '' },
    badge: { type: String, default: '' },
    isPublished: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isAntiTarnish: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'products',
  }
);

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
