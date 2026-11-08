import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    guestEmail: { type: String },
    customerName: { type: String },
    customerPhone: { type: String },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        title: { type: String },
        price: { type: Number },
        quantity: { type: Number, default: 1 },
        image: { type: String },
        sku: { type: String },
      },
    ],
    shippingAddress: {
      fullName: { type: String },
      phone: { type: String },
      addressLine1: { type: String },
      addressLine2: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String, default: 'India' },
    },
    paymentMethod: { type: String, default: 'COD' },
    paymentStatus: { type: String, default: 'PENDING' },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'DISPATCHED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'CONFIRMED',
    },
    trackingNumber: { type: String },
    courierName: { type: String, default: 'BlueDart Express' },
  },
  {
    timestamps: true,
    collection: 'orders',
  }
);

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
