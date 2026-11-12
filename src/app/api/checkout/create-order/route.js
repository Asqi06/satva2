import { NextResponse } from 'next/server';
import { createRazorpayOrder } from '../../../../lib/razorpay';
import { priceOrder } from '../../../../lib/orderPricing';
import { checkRateLimit, getClientKey } from '../../../../lib/rateLimit';

export async function POST(request) {
  try {
    const rate = checkRateLimit(`checkout:${getClientKey(request)}`, 15, 10 * 60 * 1000);
    if (!rate.allowed) return NextResponse.json({ success: false, error: 'Too many checkout attempts. Try again later.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } });
    if (Number(request.headers.get('content-length') || 0) > 64 * 1024) return NextResponse.json({ success: false, error: 'Request is too large.' }, { status: 413 });
    const body = await request.json();
    const { items, receipt, notes, couponCode, paymentMethod } = body;
    const order = await priceOrder({ items, couponCode, paymentMethod: paymentMethod || 'upi' });
    if (order.total <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid order amount is required.' },
        { status: 400 }
      );
    }

    const razorpayOrder = await createRazorpayOrder({
      amountInRupees: order.total,
      receipt: receipt || `SAT_${Date.now()}`,
      notes: { ...(notes || {}), couponCode: order.couponCode },
    });

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderSummary: { subtotal: order.subtotal, discountAmount: order.discountAmount, shippingFee: order.shippingFee, total: order.total },
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('API /api/checkout/create-order error:', err);
    return NextResponse.json(
      { success: false, error: /cart|product|coupon|order|invalid|stock|minimum/i.test(err.message || '') ? err.message : 'Failed to initiate Razorpay order.' },
      { status: /cart|product|coupon|order|invalid|stock/i.test(err.message || '') ? 400 : 500 }
    );
  }
}
