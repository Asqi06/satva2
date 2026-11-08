import { NextResponse } from 'next/server';
import { connectDb } from '../../../lib/db';
import { Product } from '../../../models/Product';
import { products as fallbackProducts } from '../../../data/products';

export async function GET(request) {
  try {
    await connectDb();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = Number(searchParams.get('limit')) || 100;

    const query = {};
    if (category && category !== 'all') {
      query.$or = [
        { category: new RegExp(category, 'i') },
        { tags: new RegExp(category, 'i') },
      ];
    }
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { name: new RegExp(search, 'i') },
        { sku: new RegExp(search, 'i') },
      ];
    }

    const dbProducts = await Product.find(query).limit(limit).lean();

    if (dbProducts && dbProducts.length > 0) {
      const formatted = dbProducts.map((p) => ({
        id: p._id.toString(),
        mongoId: p._id.toString(),
        title: p.title || p.name || 'Demi-Fine Jewellery',
        slug: p.slug || p._id.toString(),
        price: p.price,
        mrp: p.mrp || p.compareAtPrice || p.oldPrice || p.price * 2,
        rating: p.rating || p.ratingAverage || 4.8,
        reviewsCount: p.reviewsCount || p.ratingCount || 0,
        badge: p.badge || (p.isFeatured ? 'BESTSELLER' : ''),
        category: p.category || 'anti-tarnish',
        subcategory: p.subcategory || 'jewellery',
        material: p.material || '18K Gold Plated 316L Surgical Steel',
        tags: p.tags || [],
        stock: p.stockQuantity ?? p.stock ?? 10,
        sku: p.sku || `SATVA-${p._id.toString().slice(-6).toUpperCase()}`,
        image: p.image || p.images?.[0]?.secureUrl || '',
        images: p.images || [],
        description: p.description || '',
      }));
      return NextResponse.json({ success: true, count: formatted.length, products: formatted });
    }

    // Fallback to static catalog if DB collection empty
    return NextResponse.json({ success: true, count: fallbackProducts.length, products: fallbackProducts });
  } catch (err) {
    console.error('API /api/products error:', err);
    // Return fallback gracefully
    return NextResponse.json({ success: true, count: fallbackProducts.length, products: fallbackProducts, error: err.message });
  }
}

export async function POST(request) {
  try {
    await connectDb();
    const body = await request.json();

    if (!body.title || !body.price) {
      return NextResponse.json({ success: false, error: 'Title and price are required.' }, { status: 400 });
    }

    const slug =
      body.slug ||
      body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + `-${Date.now().toString().slice(-4)}`;

    const newProduct = new Product({
      title: body.title,
      name: body.title,
      slug,
      price: Number(body.price),
      mrp: Number(body.mrp) || Number(body.price) * 2,
      oldPrice: Number(body.mrp) || Number(body.price) * 2,
      description: body.description || '',
      category: body.category || 'anti-tarnish',
      subcategory: body.subcategory || 'jewellery',
      material: body.material || '18K Gold Plated 316L Surgical Steel',
      image: body.image || '',
      images: body.image ? [{ publicId: '', secureUrl: body.image, alt: body.title, isThumbnail: true }] : [],
      tags: body.tags || ['anti-tarnish', 'waterproof'],
      stock: Number(body.stock) || 15,
      stockQuantity: Number(body.stock) || 15,
      sku: body.sku || `SATVA-${Math.floor(100000 + Math.random() * 900000)}`,
      badge: body.badge || 'NEW ARRIVAL',
      isPublished: true,
      isFeatured: body.isFeatured !== false,
      rating: 5.0,
      reviewsCount: 0,
    });

    await newProduct.save();

    return NextResponse.json({ success: true, product: newProduct });
  } catch (err) {
    console.error('POST /api/products error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDb();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID is required.' }, { status: 400 });
    }

    const updated = await Product.findByIdAndUpdate(id, { $set: updates }, { new: true });
    return NextResponse.json({ success: true, product: updated });
  } catch (err) {
    console.error('PUT /api/products error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID is required.' }, { status: 400 });
    }

    await Product.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Product deleted from MongoDB.' });
  } catch (err) {
    console.error('DELETE /api/products error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
