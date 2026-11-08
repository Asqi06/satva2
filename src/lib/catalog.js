import { connectDb } from './db.js';
import { Product } from '../models/Product.js';
import { products as staticProducts } from '../data/products.js';

function normalizeDbProduct(p, index = 0) {
  const title = p.title || p.name || 'Demi-Fine Jewellery';
  const rawCat = (p.category || '').toLowerCase();
  const rawSubcat = (p.subcategory || '').toLowerCase();
  const rawTitle = title.toLowerCase();
  const tags = Array.isArray(p.tags) ? p.tags.map((t) => String(t).toLowerCase()) : [];

  const isAntiTarnish =
    p.isAntiTarnish !== false ||
    rawTitle.includes('anti-tarnish') ||
    rawTitle.includes('anti tarnish') ||
    rawTitle.includes('waterproof') ||
    rawTitle.includes('stainless steel') ||
    rawTitle.includes('18k gold') ||
    rawTitle.includes('pvd');

  const isKorean =
    rawCat.includes('korean') ||
    rawTitle.includes('korean') ||
    rawTitle.includes('aesthetic') ||
    rawTitle.includes('dainty') ||
    rawTitle.includes('pearl') ||
    tags.some((t) => t.includes('korean'));

  const isIndian =
    rawCat.includes('traditional') ||
    rawTitle.includes('jhumka') ||
    rawTitle.includes('chandbali') ||
    rawTitle.includes('mangalsutra') ||
    rawTitle.includes('kundan') ||
    rawTitle.includes('temple') ||
    rawTitle.includes('oxidised') ||
    rawTitle.includes('boho') ||
    rawTitle.includes('bangle set');

  // Determine subcategory
  let subcategory = 'jewellery';
  if (
    rawCat.includes('necklace') ||
    rawSubcat.includes('necklace') ||
    rawTitle.includes('necklace') ||
    rawTitle.includes('chain') ||
    rawTitle.includes('choker') ||
    rawTitle.includes('pendant')
  ) {
    subcategory = 'necklaces';
  } else if (
    rawCat.includes('earring') ||
    rawSubcat.includes('earring') ||
    rawTitle.includes('earring') ||
    rawTitle.includes('jhumka') ||
    rawTitle.includes('chandbali') ||
    rawTitle.includes('drop') ||
    rawTitle.includes('hoop')
  ) {
    subcategory = 'earrings';
  } else if (
    rawCat.includes('bracelet') ||
    rawSubcat.includes('bracelet') ||
    rawTitle.includes('bracelet') ||
    rawTitle.includes('bangle') ||
    rawTitle.includes('watch')
  ) {
    subcategory = 'bracelets';
  } else if (rawCat.includes('ring') || rawSubcat.includes('ring') || rawTitle.includes('ring')) {
    subcategory = 'rings';
  } else if (rawCat.includes('hamper') || rawTitle.includes('hamper') || rawTitle.includes('box')) {
    subcategory = 'hampers';
  }

  // Determine category grouping
  let category = 'western';
  if (isKorean) {
    category = 'korean';
  } else if (isIndian) {
    category = 'indian';
  } else if (isAntiTarnish) {
    category = 'anti-tarnish';
  }

  // Tags compilation
  const normalizedTags = new Set(tags);
  if (isAntiTarnish) {
    normalizedTags.add('anti-tarnish');
    normalizedTags.add('waterproof');
    normalizedTags.add('hypoallergenic');
  }
  if (isKorean) normalizedTags.add('korean');
  if (isIndian) normalizedTags.add('indian');
  normalizedTags.add('western');
  if (subcategory) normalizedTags.add(subcategory);

  const mainImage = p.image || p.images?.[0]?.secureUrl || '';
  const images =
    p.images && p.images.length > 0
      ? p.images.map((img) => ({
          secureUrl: img.secureUrl || img.url || '',
          alt: img.alt || title,
          isThumbnail: !!img.isThumbnail,
        }))
      : mainImage
      ? [{ secureUrl: mainImage, alt: title, isThumbnail: true }]
      : [];

  const price = Number(p.price) || 199;
  const mrp = Number(p.mrp || p.oldPrice || p.compareAtPrice || price * 2);

  // Give real MongoDB Atlas products primary popularity so they lead bestsellers
  const baseSold = p.isFeatured ? 2800 : 1200;
  const soldCount =
    Number(p.soldQuantity) > 0
      ? Number(p.soldQuantity)
      : baseSold + ((index * 37) % 600);

  return {
    id: p._id.toString(),
    mongoId: p._id.toString(),
    slug: p.slug || p._id.toString(),
    title,
    price,
    mrp: mrp > price ? mrp : price * 2,
    rating: Number(p.rating || p.ratingAverage || 4.8),
    reviews: Number(p.reviewsCount || p.ratingCount || 42),
    badge: p.badge || (p.isFeatured ? 'BESTSELLER' : isAntiTarnish ? 'WATERPROOF' : 'DEMI-FINE'),
    category,
    rawCategory: p.category,
    subcategory,
    material: p.material || (isAntiTarnish ? '18K Gold Plated 316L Surgical Steel' : 'Fine Brass with 18K Gold PVD'),
    tags: Array.from(normalizedTags),
    colors: p.colors && p.colors.length > 0 ? p.colors : ['#D4AF37', '#C0C0C0'],
    isCod: true,
    isFreeShipping: price >= 499,
    image: mainImage,
    images,
    stock: p.stockQuantity ?? p.stock ?? 15,
    sku: p.sku || `SATVA-${p._id.toString().slice(-6).toUpperCase()}`,
    description: p.description || `${title} crafted for everyday wear with 18k real gold vacuum PVD finish. 100% shower and sweat safe.`,
    isAntiTarnish,
    soldCount,
    imageBg: 'linear-gradient(135deg, #f7efe2 0%, #ecdcc3 100%)',
    secondaryBg: 'linear-gradient(135deg, #ecdcc3 0%, #dbbe97 100%)',
  };
}

/**
 * Fetch all products placing live MongoDB Atlas items FIRST across the storefront.
 * When database products are present, return exclusively live database items.
 */
export async function getLiveCatalog() {
  try {
    await connectDb();
    const dbProducts = await Product.find({ isPublished: { $ne: false } })
      .sort({ createdAt: -1 })
      .lean();

    if (dbProducts && dbProducts.length > 0) {
      return dbProducts.map((p, i) => normalizeDbProduct(p, i));
    }

    return staticProducts;
  } catch (err) {
    console.error('getLiveCatalog MongoDB error, falling back to static:', err?.message);
    return staticProducts;
  }
}

/**
 * Fetch a single product by numeric id, MongoDB ObjectId, or slug.
 */
export async function getLiveProductByIdOrSlug(idOrSlug) {
  if (!idOrSlug) return null;
  const strId = String(idOrSlug).trim();

  // 1. Check MongoDB Atlas first
  try {
    await connectDb();
    let query;
    if (strId.match(/^[0-9a-fA-F]{24}$/)) {
      query = { $or: [{ _id: strId }, { slug: strId }] };
    } else {
      query = { slug: strId };
    }

    const dbProd = await Product.findOne(query).lean();
    if (dbProd) {
      return normalizeDbProduct(dbProd, 0);
    }
  } catch (err) {
    console.error('getLiveProductByIdOrSlug DB error:', err?.message);
  }

  // 2. Check static catalog by numeric id or slug
  const staticFound = staticProducts.find(
    (p) => String(p.id) === strId || p.slug === strId
  );
  if (staticFound) return staticFound;

  return null;
}

/**
 * Get products filtered by tag (e.g. 'anti-tarnish', 'waterproof')
 */
export async function getLiveProductsByTag(tag) {
  const all = await getLiveCatalog();
  const lowerTag = tag.toLowerCase();
  return all.filter((p) => p.tags && p.tags.includes(lowerTag));
}

/**
 * Get products filtered by category ('korean', 'indian', 'western', 'anti-tarnish')
 */
export async function getLiveProductsByCategory(category) {
  const all = await getLiveCatalog();
  if (!category || category === 'all') return all;
  const lower = category.toLowerCase();
  return all.filter(
    (p) =>
      (p.tags && p.tags.includes(lower)) ||
      p.category === lower ||
      (p.rawCategory && p.rawCategory.toLowerCase() === lower)
  );
}

/**
 * Get bestsellers - real database pieces are ranked highest
 */
export async function getLiveBestsellers(limit = 8) {
  const all = await getLiveCatalog();
  return [...all].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, limit);
}

/**
 * Get related pieces
 */
export async function getLiveRelatedProducts(product, limit = 4) {
  if (!product) return [];
  const all = await getLiveCatalog();
  return all
    .filter(
      (p) =>
        String(p.id) !== String(product.id) &&
        (p.subcategory === product.subcategory || p.category === product.category)
    )
    .slice(0, limit);
}

export const DEFAULT_HOMEPAGE_CATEGORIES = [
  {
    id: 'cat-chains',
    name: 'Anti-Tarnish Chains',
    count: 'Waterproof steel',
    description: 'Waterproof steel',
    href: '/anti-tarnish-jewellery',
    image: 'https://res.cloudinary.com/dqguetjwm/image/upload/v1777868866/lkbtrxli6hvd3vuljynp.jpg',
    bg: 'linear-gradient(135deg, #f7efe2 0%, #ecdcc3 100%)',
    sortOrder: 0,
    isFeatured: true,
  },
  {
    id: 'cat-korean',
    name: 'Korean Minimalist',
    count: 'Freshwater pearls',
    description: 'Freshwater pearls',
    href: '/korean-jewellery',
    image: 'https://res.cloudinary.com/dqguetjwm/image/upload/v1777861251/hjczebutzkna4fa9sose.png',
    bg: 'linear-gradient(135deg, #fff0f5 0%, #fadadd 100%)',
    sortOrder: 1,
    isFeatured: true,
  },
  {
    id: 'cat-rings',
    name: 'Everyday Rings',
    count: 'Stackable bands',
    description: 'Stackable bands',
    href: '/western-jewellery',
    image: 'https://res.cloudinary.com/dqguetjwm/image/upload/v1777869918/ijtndbmsvdt9tiudvdsm.jpg',
    bg: 'linear-gradient(135deg, #fbf7ee 0%, #ede0cb 100%)',
    sortOrder: 2,
    isFeatured: true,
  },
  {
    id: 'cat-mangalsutra',
    name: 'Daily Mangalsutra',
    count: 'Modern black bead',
    description: 'Modern black bead',
    href: '/indian-jewellery',
    image: 'https://res.cloudinary.com/dqguetjwm/image/upload/v1777860481/e0g0gvxrar3ycuvthjz4.png',
    bg: 'linear-gradient(135deg, #fbf2ec 0%, #f4decb 100%)',
    sortOrder: 3,
    isFeatured: true,
  },
  {
    id: 'cat-bracelets',
    name: 'Tennis Bracelets',
    count: '5A cubic zirconia',
    description: '5A cubic zirconia',
    href: '/western-jewellery',
    image: 'https://res.cloudinary.com/dqguetjwm/image/upload/v1777860989/p9z2hxpcfksy25gcc1uf.png',
    bg: 'linear-gradient(135deg, #f7f2eb 0%, #e9dfd0 100%)',
    sortOrder: 4,
    isFeatured: true,
  },
  {
    id: 'cat-sets',
    name: 'Curated Sets',
    count: 'Combined savings',
    description: 'Combined savings',
    href: '/sale',
    image: 'https://res.cloudinary.com/dqguetjwm/image/upload/v1777711970/rglj3nkhqg8unjmakssj.jpg',
    bg: 'linear-gradient(135deg, #edf7ee 0%, #d8ebd9 100%)',
    sortOrder: 5,
    isFeatured: true,
  },
];

/**
 * Get categories for homepage "Shop by category" strip
 */
export async function getHomepageCategories() {
  try {
    await connectDb();
    const { Category } = await import('../models/Category.js');
    const docs = await Category.find({ isPublished: { $ne: false }, isFeatured: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    if (docs && docs.length > 0) {
      return docs.map((d, idx) => ({
        id: d._id.toString(),
        name: d.name,
        slug: d.slug,
        count: d.description || '',
        description: d.description || '',
        href: d.href || `/${d.slug}`,
        image: (typeof d.image === 'string' && d.image.trim()) 
          ? d.image.trim() 
          : (d.image?.secureUrl || DEFAULT_HOMEPAGE_CATEGORIES[idx % DEFAULT_HOMEPAGE_CATEGORIES.length]?.image || ''),
        bg: d.bg || (DEFAULT_HOMEPAGE_CATEGORIES[idx % DEFAULT_HOMEPAGE_CATEGORIES.length]?.bg || 'linear-gradient(135deg, #f7efe2 0%, #ecdcc3 100%)'),
        sortOrder: d.sortOrder ?? idx,
      }));
    }
  } catch (err) {
    console.warn('Could not load categories from DB, falling back to defaults:', err.message);
  }
  return DEFAULT_HOMEPAGE_CATEGORIES;
}
