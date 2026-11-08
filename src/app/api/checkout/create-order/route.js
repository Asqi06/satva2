import { NextResponse } from 'next/server';
import { createRazorpayOrder } from '../../../../lib/razorpay';

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, receipt, notes } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid order amount is required.' },
        { status: 400 }
      );
    }

    const razorpayOrder = await createRazorpayOrder({
      amountInRupees: amount,
      receipt: receipt || `SAT_${Date.now()}`,
      notes: notes || {},
    });

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('API /api/checkout/create-order error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to initiate Razorpay order.' },
      { status: 500 }
    );
  }
}
