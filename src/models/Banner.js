import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    subtitle: { type: String, trim: true, maxlength: 280 },
    image: {
      publicId: { type: String, maxlength: 512, default: '' },
      secureUrl: { type: String, required: true, maxlength: 2048 },
      alt: { type: String, maxlength: 200, default: '' },
    },
    imageUrl: { type: String },
    link: { type: String, default: '/anti-tarnish-jewellery' },
    redirectUrl: { type: String },
    placement: { type: String, enum: ['hero', 'collection', 'promo'], default: 'hero' },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    startsAt: { type: Date },
    endsAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'banners',
  }
);

export const Banner = mongoose.models.Banner || mongoose.model('Banner', bannerSchema);
