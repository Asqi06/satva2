import { NextResponse } from 'next/server';
import { connectDb } from '../../../lib/db';
import { Coupon } from '../../../models/Coupon';

export async function GET(request) {
  try {
    await connectDb();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (code) {
      const cleanCode = code.trim().toUpperCase();
      const coupon = await Coupon.findOne({
        code: cleanCode,
        $or: [{ isActive: true }, { active: true }],
      }).lean();

      if (!coupon) {
        return NextResponse.json({ success: false, error: 'Invalid or expired coupon code.' }, { status: 404 });
      }

      // Check expiry date
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return NextResponse.json({ success: false, error: 'This coupon code has expired.' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        coupon: {
          code: coupon.code,
          type: (coupon.type || 'PERCENTAGE').toUpperCase(),
          value: coupon.value,
          minPurchase: coupon.minimumOrderValue ?? coupon.minPurchase ?? 0,
          maxDiscount: coupon.maximumDiscount ?? null,
        },
      });
    }

    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, count: coupons.length, coupons });
  } catch (err) {
    console.error('API /api/coupons error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDb();
    const body = await request.json();

    if (!body.code || !body.value) {
      return NextResponse.json({ success: false, error: 'Coupon code and discount value are required.' }, { status: 400 });
    }

    const code = body.code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Coupon code already exists.' }, { status: 409 });
    }

    const newCoupon = new Coupon({
      code,
      type: body.type ? body.type.toUpperCase() : 'PERCENTAGE',
      value: Number(body.value),
      minimumOrderValue: Number(body.minPurchase) || 0,
      minPurchase: Number(body.minPurchase) || 0,
      maximumDiscount: body.maxDiscount ? Number(body.maxDiscount) : undefined,
      isActive: true,
      active: true,
      description: body.description || '',
    });

    await newCoupon.save();
    return NextResponse.json({ success: true, coupon: newCoupon }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
