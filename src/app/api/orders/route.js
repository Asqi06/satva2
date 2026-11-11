import { NextResponse } from 'next/server';
import { connectDb } from '@/lib/db';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectDb();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const orderNumber = searchParams.get('orderNumber');
    const limit = Number(searchParams.get('limit')) || 100;

    const query = {};
    if (email) {
      query.$or = [
        { 'customer.email': email },
        { 'shippingAddress.email': email },
        { guestEmail: email },
        { userEmail: email },
      ];
    }
    if (orderNumber) {
      query.$or = [
        { orderNumber },
        { _id: mongoose.isValidObjectId(orderNumber) ? new mongoose.Types.ObjectId(orderNumber) : null },
      ].filter((cond) => cond._id !== null || cond.orderNumber);
    }

    const orders = await mongoose.connection.db
      .collection('orders')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    const formatted = orders.map((o) => {
      // 1. Customer Name (handle all schemas)
      const customerName =
        o.customer?.fullName ||
        o.customer?.name ||
        o.shippingAddress?.fullName ||
        o.shippingAddress?.name ||
        o.customerName ||
        'Valued Client';

      // 2. Email
      const customerEmail =
        o.customer?.email ||
        o.shippingAddress?.email ||
        o.guestEmail ||
        o.userEmail ||
        '';

      // 3. Phone
      const customerPhone =
        o.customer?.phone ||
        o.shippingAddress?.phone ||
        o.customerPhone ||
        '';

      // 4. Street Address & Address Lines
      const streetAddress =
        o.customer?.address ||
        [o.shippingAddress?.addressLine1, o.shippingAddress?.addressLine2]
          .filter(Boolean)
          .join(', ') ||
        '';

      // 5. City, State, Pincode, Country
      const city = o.customer?.city || o.shippingAddress?.city || '';
      const state = o.customer?.state || o.shippingAddress?.state || '';
      const pincode =
        o.customer?.pincode ||
        o.shippingAddress?.postalCode ||
        o.shippingAddress?.pincode ||
        '';
      const country = o.customer?.country || o.shippingAddress?.country || 'India';

      // Full readable address
      const fullAddressParts = [streetAddress, city, state ? `${state} - ${pincode}` : pincode, country].filter(
        Boolean
      );
      const fullAddress = fullAddressParts.join(', ') || 'Address not specified';

      // 6. Items normalization
      const items = (o.items || []).map((it, idx) => ({
        id: it._id?.toString() || it.id || it.productId?.toString() || `item-${idx}`,
        title: it.title || it.name || 'Atelier Fine Jewellery Piece',
        price: Number(it.price || it.unitPrice || 0),
        quantity: Number(it.quantity || it.qty || 1),
        finish: it.finish || (it.options?.[0]) || '18K Gold Plated',
        image: it.image || '',
        sku: it.sku || '',
      }));

      // 7. Financials
      const amount = Number(o.amount || o.total || 0);
      const subtotal = Number(o.subtotal || amount);
      const discountAmount = Number(o.discountAmount || o.discount || 0);
      const shippingFee = Number(o.shipping || o.shippingFee || 0);

      // 8. Order & Payment Status
      const rawStatus = o.status || o.orderStatus || 'Confirmed';
      const status =
        rawStatus.toUpperCase() === 'PENDING'
          ? 'Pending Dispatch'
          : rawStatus.toUpperCase() === 'DELIVERED'
          ? 'Delivered'
          : rawStatus.toUpperCase() === 'CANCELLED'
          ? 'Cancelled'
          : rawStatus;

      const paymentMethod =
        o.paymentMethod ||
        (o.paymentId === 'COD' || o.orderId?.startsWith('COD') ? 'COD' : 'Razorpay');

      const paymentStatus =
        o.paymentStatus ||
        (status === 'Delivered' || status === 'Paid'
          ? 'PAID'
          : paymentMethod === 'COD'
          ? 'PENDING'
          : 'COMPLETED');

      return {
        id: o._id.toString(),
        orderNumber: o.orderNumber || `SAT-${o._id.toString().slice(-4).toUpperCase()}`,
        customer: customerName,
        customerName,
        email: customerEmail,
        phone: customerPhone,
        address: streetAddress,
        city,
        state,
        pincode,
        country,
        fullAddress,
        items,
        amount,
        total: amount,
        subtotal,
        discountAmount,
        shippingFee,
        couponCode: o.couponCode || '',
        status,
        paymentMethod,
        paymentStatus,
        paymentId: o.paymentId || '',
        orderId: o.orderId || o.razorpayOrderId || '',
        trackingId: o.trackingId || o.trackingNumber || '',
        courierName: o.courierName || 'BlueDart Express',
        createdAt: o.createdAt || new Date(),
      };
    });

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

    const customerName =
      body.customer?.fullName ||
      body.customer?.name ||
      body.shippingAddress?.fullName ||
      body.customerName ||
      'Valued Client';

    const customerEmail =
      body.customer?.email ||
      body.shippingAddress?.email ||
      body.guestEmail ||
      '';

    const customerPhone =
      body.customer?.phone ||
      body.shippingAddress?.phone ||
      body.customerPhone ||
      '';

    const addressLine1 =
      body.customer?.address ||
      body.shippingAddress?.addressLine1 ||
      '';

    const addressLine2 =
      body.customer?.addressLine2 ||
      body.shippingAddress?.addressLine2 ||
      '';

    const city = body.customer?.city || body.shippingAddress?.city || '';
    const state = body.customer?.state || body.shippingAddress?.state || '';
    const pincode =
      body.customer?.pincode ||
      body.shippingAddress?.postalCode ||
      body.shippingAddress?.pincode ||
      '';
    const country = body.customer?.country || body.shippingAddress?.country || 'India';

    const orderDoc = {
      orderNumber,
      customer: {
        name: customerName,
        fullName: customerName,
        email: customerEmail,
        phone: customerPhone,
        address: addressLine1,
        addressLine2,
        city,
        state,
        pincode,
        country,
      },
      shippingAddress: {
        fullName: customerName,
        phone: customerPhone,
        email: customerEmail,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode: pincode,
        pincode,
        country,
      },
      customerName,
      customerPhone,
      guestEmail: customerEmail,
      items: (body.items || []).map((it) => ({
        id: it.id || it.productId || '',
        title: it.title || it.name || 'Atelier Jewellery',
        price: Number(it.price || it.unitPrice || 0),
        quantity: Number(it.quantity || it.qty || 1),
        finish: it.finish || (it.options?.[0]) || '18K Gold Plated',
        image: it.image || '',
        sku: it.sku || '',
      })),
      amount: Number(body.total || body.amount || 0),
      total: Number(body.total || body.amount || 0),
      subtotal: Number(body.subtotal || body.total || body.amount || 0),
      discountAmount: Number(body.discountAmount || body.discount || 0),
      couponCode: body.couponCode || '',
      status: 'Confirmed',
      paymentMethod: body.paymentMethod || 'COD',
      paymentStatus: body.paymentMethod === 'COD' ? 'PENDING' : 'COMPLETED',
      paymentId: body.paymentId || (body.paymentMethod === 'COD' ? `COD-${Date.now()}` : ''),
      orderId: body.orderId || '',
      createdAt: new Date(),
      trackingId: `BD-${Math.floor(10000000 + Math.random() * 90000000)}`,
      courierName: 'BlueDart Express',
    };

    const result = await mongoose.connection.db.collection('orders').insertOne(orderDoc);

    return NextResponse.json(
      {
        success: true,
        orderId: result.insertedId.toString(),
        orderNumber,
        order: { ...orderDoc, _id: result.insertedId.toString() },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('API POST /api/orders error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDb();
    const body = await request.json();
    const { id, orderNumber, status, trackingId, courierName } = body;

    if (!id && !orderNumber) {
      return NextResponse.json(
        { success: false, error: 'Order ID or Order Number required.' },
        { status: 400 }
      );
    }

    const filter = {};
    if (id && mongoose.isValidObjectId(id)) {
      filter._id = new mongoose.Types.ObjectId(id);
    } else if (orderNumber) {
      filter.orderNumber = orderNumber;
    } else if (id) {
      filter.orderNumber = id;
    }

    const update = {};
    if (status) {
      update.status = status;
      update.orderStatus = status;
    }
    if (trackingId !== undefined) {
      update.trackingId = trackingId;
      update.trackingNumber = trackingId;
    }
    if (courierName) {
      update.courierName = courierName;
    }
    update.updatedAt = new Date();

    const updated = await mongoose.connection.db.collection('orders').findOneAndUpdate(
      filter,
      { $set: update },
      { returnDocument: 'after' }
    );

    return NextResponse.json({ success: true, order: updated });
  } catch (err) {
    console.error('API PUT /api/orders error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
