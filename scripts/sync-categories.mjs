import { connectDb } from '../src/lib/db.js';
import { Category } from '../src/models/Category.js';
import { DEFAULT_HOMEPAGE_CATEGORIES } from '../src/lib/catalog.js';

async function sync() {
  await connectDb();
  console.log('Connected to MongoDB Atlas.');

  for (let i = 0; i < DEFAULT_HOMEPAGE_CATEGORIES.length; i++) {
    const item = DEFAULT_HOMEPAGE_CATEGORIES[i];
    const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = await Category.findOne({ $or: [{ slug }, { name: item.name }] });
    if (existing) {
      existing.name = item.name;
      existing.description = item.count;
      existing.href = item.href;
      existing.image = { publicId: '', secureUrl: item.image, alt: item.name };
      existing.isFeatured = true;
      existing.isPublished = true;
      existing.sortOrder = i;
      await existing.save();
      console.log('Updated existing category:', item.name);
    } else {
      await Category.create({
        name: item.name,
        slug,
        description: item.count,
        href: item.href,
        image: { publicId: '', secureUrl: item.image, alt: item.name },
        isFeatured: true,
        isPublished: true,
        sortOrder: i,
        bg: item.bg,
      });
      console.log('Created featured category:', item.name);
    }
  }

  const all = await Category.find({}).sort({ sortOrder: 1 }).lean();
  console.log('Total categories in MongoDB Atlas:', all.length);
  for (const c of all) {
    const img = typeof c.image === 'string' ? c.image : c.image?.secureUrl;
    console.log(`- [${c.sortOrder}] ${c.name} (${c.slug}) -> ${img ? 'HAS IMAGE' : 'NO IMAGE'} (featured: ${c.isFeatured})`);
  }
  process.exit(0);
}

sync().catch(err => {
  console.error(err);
  process.exit(1);
});
