import { NextResponse } from 'next/server';
import { connectDb } from '../../../lib/db';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    await connectDb();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const orderNumber = searchParams.get('orderNumber');

    const query = {};
    if (email) {
      query.$or = [{ 'customer.email': email }, { guestEmail: email }];
    }
    if (orderNumber) {
      query.orderNumber = orderNumber;
    }

    const orders = await mongoose.connection.db
      .collection('orders')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const formatted = orders.map((o) => ({
      id: o._id.toString(),
      orderNumber: o.orderNumber || `SAT-${o._id.toString().slice(-4).toUpperCase()}`,
      customer: o.customer?.name || o.customerName || 'Customer',
      email: o.customer?.email || o.guestEmail || '',
      phone: o.customer?.phone || o.customerPhone || '',
      address: o.customer?.address || o.shippingAddress?.addressLine1 || '',
      city: o.customer?.city || o.shippingAddress?.city || '',
      pincode: o.customer?.pincode || o.shippingAddress?.postalCode || '',
      items: o.items || [],
      amount: o.amount || o.total || 0,
      discountAmount: o.discountAmount || o.discount || 0,
      couponCode: o.couponCode || '',
      status: o.status || 'Confirmed',
      paymentMethod: o.paymentMethod || 'Razorpay',
      trackingId: o.trackingId || o.trackingNumber || 'BD-BLUEDART-884920',
      createdAt: o.createdAt,
    }));

    return NextResponse.json({ success: true, count: formatted.length, orders: formatted });
  } catch (err) {
    console.error('API /api/orders error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDb();
    const body = await request.json();

    const orderNumber = `SAT-${Math.floor(1000 + Math.random() * 9000)}`;

    const orderDoc = {
      orderNumber,
      customer: {
        name: body.customer?.name || body.customerName || 'Guest Customer',
        email: body.customer?.email || body.guestEmail || '',
        phone: body.customer?.phone || body.customerPhone || '',
        address: body.customer?.address || body.shippingAddress?.addressLine1 || '',
        city: body.customer?.city || body.shippingAddress?.city || '',
        pincode: body.customer?.pincode || body.shippingAddress?.postalCode || '',
      },
      items: body.items || [],
      amount: Number(body.total || body.amount || 0),
      discountAmount: Number(body.discountAmount || body.discount || 0),
      couponCode: body.couponCode || '',
      status: 'Confirmed',
      paymentMethod: body.paymentMethod || 'COD',
      paymentId: body.paymentId || '',
      orderId: body.orderId || '',
      createdAt: new Date(),
      trackingId: `BD-${Math.floor(10000000 + Math.random() * 90000000)}`,
    };

    const result = await mongoose.connection.db.collection('orders').insertOne(orderDoc);

    return NextResponse.json(
      {
        success: true,
        orderId: result.insertedId,
        orderNumber,
        order: { ...orderDoc, _id: result.insertedId },
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDb();
    const body = await request.json();
    const { id, orderNumber, status, trackingId } = body;

    if (!id && !orderNumber) {
      return NextResponse.json({ success: false, error: 'Order ID or Order Number required.' }, { status: 400 });
    }

    const filter = id ? { _id: new mongoose.Types.ObjectId(id) } : { orderNumber };
    const update = {};
    if (status) update.status = status;
    if (trackingId) update.trackingId = trackingId;

    const updated = await mongoose.connection.db.collection('orders').findOneAndUpdate(
      filter,
      { $set: update },
      { returnDocument: 'after' }
    );

    return NextResponse.json({ success: true, order: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
