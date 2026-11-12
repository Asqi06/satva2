import { NextResponse } from 'next/server';
import { connectDb } from '../../../lib/db';
import { Banner } from '../../../models/Banner';
import { DEFAULT_PROMO_BANNERS } from '../../../data/promotions';
import { requireAdmin } from '../../../lib/adminAuth';

export async function GET() {
  try {
    await connectDb();
    const dbBanners = await Banner.find({}).sort({ sortOrder: 1, createdAt: -1 }).lean();

    if (dbBanners && dbBanners.length > 0) {
      const formatted = dbBanners.filter((b) => (b.isActive ?? b.active ?? true)).map((b) => ({
        id: b._id.toString(),
        mongoId: b._id.toString(),
        title: b.title || 'Campaign Banner',
        imageUrl: b.image?.secureUrl || b.imageUrl || '',
        redirectUrl: b.link || b.redirectUrl || '/anti-tarnish-jewellery',
        active: b.isActive ?? b.active ?? true,
        sortOrder: b.sortOrder || 0,
        altText: b.image?.alt || b.title || '',
      }));
      return NextResponse.json({ success: true, count: formatted.length, banners: formatted });
    }

    return NextResponse.json({ success: true, count: DEFAULT_PROMO_BANNERS.length, banners: DEFAULT_PROMO_BANNERS });
  } catch (err) {
    console.error('API /api/banners error:', err);
    return NextResponse.json({ success: true, count: DEFAULT_PROMO_BANNERS.length, banners: DEFAULT_PROMO_BANNERS });
  }
}

export async function POST(request) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;
    await connectDb();
    const body = await request.json();

    if (!body.imageUrl && !body.image?.secureUrl) {
      return NextResponse.json({ success: false, error: 'Banner image URL is required.' }, { status: 400 });
    }

    const imageUrl = body.imageUrl || body.image?.secureUrl;
    const redirectUrl = body.redirectUrl || body.link || '/anti-tarnish-jewellery';

    const newBanner = new Banner({
      title: body.title || 'Special Promotion',
      image: {
        publicId: body.image?.publicId || '',
        secureUrl: imageUrl,
        alt: body.altText || body.title || 'Banner',
      },
      imageUrl,
      link: redirectUrl,
      redirectUrl,
      placement: 'hero',
      sortOrder: Number(body.sortOrder) || 0,
      isActive: body.active !== false,
      active: body.active !== false,
    });

    await newBanner.save();
    return NextResponse.json({ success: true, banner: newBanner }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;
    await connectDb();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Banner ID is required.' }, { status: 400 });
    }

    const banner = await Banner.findById(id);
    if (!banner) {
      return NextResponse.json({ success: false, error: 'Banner not found.' }, { status: 404 });
    }

    if (updates.title !== undefined) banner.title = updates.title;
    if (updates.imageUrl !== undefined) {
      banner.imageUrl = updates.imageUrl;
      banner.image.secureUrl = updates.imageUrl;
    }
    if (updates.redirectUrl !== undefined) {
      banner.redirectUrl = updates.redirectUrl;
      banner.link = updates.redirectUrl;
    }
    if (updates.active !== undefined) {
      banner.isActive = updates.active;
      banner.active = updates.active;
    }
    if (updates.sortOrder !== undefined) banner.sortOrder = Number(updates.sortOrder);

    await banner.save();
    return NextResponse.json({ success: true, banner });
  } catch (err) {
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
      return NextResponse.json({ success: false, error: 'Banner ID is required.' }, { status: 400 });
    }

    await Banner.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Banner deleted successfully.' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
