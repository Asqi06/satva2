import { NextResponse } from 'next/server';
import { connectDb } from '../../../../lib/db';
import { getRazorpayClient, verifyRazorpaySignature } from '../../../../lib/razorpay';
import { priceOrder } from '../../../../lib/orderPricing';
import mongoose from 'mongoose';
import { checkRateLimit, getClientKey } from '../../../../lib/rateLimit';

export async function POST(request) {
  try {
    const rate = checkRateLimit(`payment-verify:${getClientKey(request)}`, 10, 10 * 60 * 1000);
    if (!rate.allowed) return NextResponse.json({ success: false, error: 'Too many payment verification attempts.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } });
    if (Number(request.headers.get('content-length') || 0) > 128 * 1024) return NextResponse.json({ success: false, error: 'Request is too large.' }, { status: 413 });
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

    const pricedOrder = await priceOrder({ items, couponCode, paymentMethod: 'upi' });
    const razorpay = getRazorpayClient();
    const [payment, razorpayOrder] = await Promise.all([
      razorpay.payments.fetch(razorpay_payment_id),
      razorpay.orders.fetch(razorpay_order_id),
    ]);
    const expectedPaise = Math.round(pricedOrder.total * 100);
    if (
      payment.order_id !== razorpay_order_id || payment.status !== 'captured' ||
      payment.amount !== expectedPaise || razorpayOrder.amount !== expectedPaise ||
      Math.round(Number(amount) * 100) !== expectedPaise || payment.currency !== 'INR'
    ) {
      return NextResponse.json({ success: false, error: 'Payment amount does not match the current cart total.' }, { status: 400 });
    }

    // Connect to MongoDB Atlas
    await connectDb();

    const existingOrder = await mongoose.connection.db.collection('orders').findOne({ paymentId: razorpay_payment_id });
    if (existingOrder) {
      return NextResponse.json({ success: false, error: 'This payment has already been recorded.' }, { status: 409 });
    }

    const orderNumber = `SAT-${Math.floor(1000 + Math.random() * 9000)}`;
    const trackingId = `BD-${Math.floor(10000000 + Math.random() * 90000000)}-IN`;

    const customerName = customer?.fullName || customer?.name || 'Valued Client';
    const customerPhone = customer?.phone || '';
    const customerEmail = customer?.email || '';
    const addressLine1 = customer?.address || '';
    const city = customer?.city || '';
    const state = customer?.state || '';
    const pincode = customer?.pincode || '';

    const orderDoc = {
      orderNumber,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      customer: {
        name: customerName,
        fullName: customerName,
        email: customerEmail,
        phone: customerPhone,
        address: addressLine1,
        city,
        state,
        pincode,
        country: 'India',
      },
      shippingAddress: {
        fullName: customerName,
        phone: customerPhone,
        email: customerEmail,
        addressLine1,
        city,
        state,
        postalCode: pincode,
        pincode,
        country: 'India',
      },
      customerName,
      customerPhone,
      guestEmail: customerEmail,
      items: pricedOrder.items,
      subtotal: pricedOrder.subtotal,
      shipping: pricedOrder.shippingFee,
      amount: pricedOrder.total,
      total: pricedOrder.total,
      discountAmount: pricedOrder.discountAmount,
      couponCode: pricedOrder.couponCode,
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
      { success: false, error: /cart|product|coupon|order|invalid|stock|minimum/i.test(err.message || '') ? err.message : 'Failed to verify and record order.' },
      { status: /cart|product|coupon|order|invalid|stock|minimum/i.test(err.message || '') ? 400 : 500 }
    );
  }
}
