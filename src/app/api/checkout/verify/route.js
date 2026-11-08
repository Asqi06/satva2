import { NextResponse } from 'next/server';
import { connectDb } from '../../../../lib/db';
import { verifyRazorpaySignature } from '../../../../lib/razorpay';
import mongoose from 'mongoose';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customer,
      items,
      amount,
      discountAmount,
      couponCode,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Missing Razorpay signature verification parameters.' },
        { status: 400 }
      );
    }

    const isValid = verifyRazorpaySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Payment signature verification failed.' },
        { status: 400 }
      );
    }

    // Connect to MongoDB Atlas
    await connectDb();

    const orderNumber = `SAT-${Math.floor(1000 + Math.random() * 9000)}`;
    const trackingId = `BD-${Math.floor(10000000 + Math.random() * 90000000)}-IN`;

    const orderDoc = {
      orderNumber,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      customer: {
        name: customer?.fullName || customer?.name || 'Valued Client',
        email: customer?.email || '',
        phone: customer?.phone || '',
        address: customer?.address || '',
        city: customer?.city || '',
        state: customer?.state || '',
        pincode: customer?.pincode || '',
      },
      items: (items || []).map((it) => ({
        id: String(it.id),
        title: it.title,
        price: it.price,
        qty: it.quantity || 1,
        finish: it.finish || '18K Gold',
        options: it.finish ? [it.finish] : [],
      })),
      amount: Number(amount || 0),
      discountAmount: Number(discountAmount || 0),
      couponCode: couponCode || '',
      status: 'Paid',
      paymentMethod: 'Razorpay',
      trackingId,
      createdAt: new Date(),
    };

    const result = await mongoose.connection.db.collection('orders').insertOne(orderDoc);

    return NextResponse.json({
      success: true,
      orderId: result.insertedId.toString(),
      orderNumber,
      trackingId,
      order: {
        ...orderDoc,
        _id: result.insertedId.toString(),
      },
    });
  } catch (err) {
    console.error('API /api/checkout/verify error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to verify and record order.' },
      { status: 500 }
    );
  }
}
