import { NextResponse } from 'next/server';
import { connectDb } from '../../../lib/db';
import { Category } from '../../../models/Category';
import { DEFAULT_HOMEPAGE_CATEGORIES } from '../../../lib/catalog';
import { requireAdmin } from '../../../lib/adminAuth';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export async function GET(request) {
  try {
    await connectDb();
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    if (all) {
      const unauthorized = await requireAdmin();
      if (unauthorized) return unauthorized;
    }
    const featuredOnly = searchParams.get('featured') === 'true';

    const filter = {
      ...(all ? {} : { isPublished: { $ne: false } }),
      ...(featuredOnly ? { isFeatured: true } : {}),
    };
    const dbCats = await Category.find(filter).sort({ sortOrder: 1, createdAt: 1 }).lean();

    if (dbCats && dbCats.length > 0) {
      const formatted = dbCats.map((c, idx) => ({
        id: c._id.toString(),
        _id: c._id.toString(),
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        count: c.description || '',
        imageUrl: typeof c.image === 'string' ? c.image : (c.image?.secureUrl || ''),
        image: typeof c.image === 'string' ? c.image : (c.image?.secureUrl || ''),
        href: c.href || (c.slug ? `/${c.slug}` : '/anti-tarnish-jewellery'),
        isFeatured: c.isFeatured !== false,
        isPublished: c.isPublished !== false,
        sortOrder: c.sortOrder ?? idx,
        bg: c.bg || (DEFAULT_HOMEPAGE_CATEGORIES[idx % DEFAULT_HOMEPAGE_CATEGORIES.length]?.bg || 'linear-gradient(135deg, #f7efe2 0%, #ecdcc3 100%)'),
      }));
      return NextResponse.json({ success: true, count: formatted.length, categories: formatted });
    }

    return NextResponse.json({ success: true, count: DEFAULT_HOMEPAGE_CATEGORIES.length, categories: DEFAULT_HOMEPAGE_CATEGORIES });
  } catch (err) {
    console.error('API /api/categories GET error:', err);
    return NextResponse.json({ success: true, count: DEFAULT_HOMEPAGE_CATEGORIES.length, categories: DEFAULT_HOMEPAGE_CATEGORIES });
  }
}

export async function POST(request) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;
    await connectDb();
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ success: false, error: 'Category name is required.' }, { status: 400 });
    }

    const rawSlug = body.slug ? slugify(body.slug) : slugify(body.name);
    let uniqueSlug = rawSlug;
    let count = 1;
    while (await Category.exists({ slug: uniqueSlug })) {
      uniqueSlug = `${rawSlug}-${count++}`;
    }

    const imageUrl = typeof body.image === 'string' ? body.image : (body.imageUrl || body.image?.secureUrl || '');

    const newCategory = new Category({
      name: body.name.trim(),
      slug: uniqueSlug,
      description: body.description?.trim() || body.count?.trim() || '',
      image: imageUrl ? {
        publicId: body.imagePublicId || '',
        secureUrl: imageUrl,
        alt: `${body.name} category`,
      } : '',
      href: body.href?.trim() || `/${uniqueSlug}`,
      isFeatured: body.isFeatured !== false,
      isPublished: body.isPublished !== false,
      sortOrder: Number(body.sortOrder) || 0,
      bg: body.bg || 'linear-gradient(135deg, #f7efe2 0%, #ecdcc3 100%)',
    });

    await newCategory.save();

    return NextResponse.json({
      success: true,
      category: {
        id: newCategory._id.toString(),
        _id: newCategory._id.toString(),
        name: newCategory.name,
        slug: newCategory.slug,
        description: newCategory.description,
        count: newCategory.description,
        imageUrl,
        image: imageUrl,
        href: newCategory.href,
        isFeatured: newCategory.isFeatured,
        isPublished: newCategory.isPublished,
        sortOrder: newCategory.sortOrder,
        bg: newCategory.bg,
      },
    }, { status: 201 });
  } catch (err) {
    console.error('API /api/categories POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;
    await connectDb();
    const body = await request.json();
    const id = body.id || body._id;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Category ID is required.' }, { status: 400 });
    }

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found in database.' }, { status: 404 });
    }

    if (body.name !== undefined) category.name = body.name.trim();
    if (body.slug !== undefined && body.slug.trim()) {
      category.slug = slugify(body.slug.trim());
    }
    if (body.description !== undefined) category.description = body.description.trim();
    if (body.count !== undefined && !body.description) category.description = body.count.trim();

    if (body.image !== undefined || body.imageUrl !== undefined) {
      const img = body.image || body.imageUrl;
      const secureUrl = typeof img === 'string' ? img : (img?.secureUrl || '');
      category.image = {
        publicId: body.imagePublicId || '',
        secureUrl,
        alt: `${category.name} category`,
      };
    }

    if (body.href !== undefined) category.href = body.href.trim();
    if (body.isFeatured !== undefined) category.isFeatured = Boolean(body.isFeatured);
    if (body.isPublished !== undefined) category.isPublished = Boolean(body.isPublished);
    if (body.sortOrder !== undefined) category.sortOrder = Number(body.sortOrder);
    if (body.bg !== undefined) category.bg = body.bg;

    await category.save();

    const imageUrl = typeof category.image === 'string' ? category.image : (category.image?.secureUrl || '');

    return NextResponse.json({
      success: true,
      category: {
        id: category._id.toString(),
        _id: category._id.toString(),
        name: category.name,
        slug: category.slug,
        description: category.description,
        count: category.description,
        imageUrl,
        image: imageUrl,
        href: category.href,
        isFeatured: category.isFeatured,
        isPublished: category.isPublished,
        sortOrder: category.sortOrder,
        bg: category.bg,
      },
    });
  } catch (err) {
    console.error('API /api/categories PUT error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;
    await connectDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Category ID is required.' }, { status: 400 });
    }

    await Category.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Category removed successfully.' });
  } catch (err) {
    console.error('API /api/categories DELETE error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
