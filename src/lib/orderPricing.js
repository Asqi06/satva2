import { connectDb } from './db.js';
import { Coupon } from '../models/Coupon.js';
import { getLiveProductByIdOrSlug } from './catalog.js';
import { DEFAULT_VOUCHERS } from '../data/promotions.js';

export async function priceOrder({ items, couponCode = '', paymentMethod = 'cod' }) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    throw new Error('Your cart is empty or contains too many products.');
  }

  const pricedItems = await Promise.all(items.map(async (item) => {
    const quantity = Number(item?.quantity ?? item?.qty);
    if (!item?.id || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      throw new Error('A cart item is invalid.');
    }
    const product = await getLiveProductByIdOrSlug(item.id);
    if (!product || Number(product.stock) < quantity) throw new Error('A product is unavailable or out of stock.');
    return {
      id: String(product.id), title: product.title, price: Number(product.price), quantity,
      finish: item.finish || '18K Gold', image: product.image || '', sku: product.sku || '', category: product.category,
    };
  }));

  const subtotal = pricedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let discountAmount = 0;
  let normalizedCoupon = '';
  if (couponCode) {
    await connectDb();
    const code = String(couponCode).trim().toUpperCase();
    const storedCoupon = await Coupon.findOne({ code }).lean();
    const coupon = storedCoupon || DEFAULT_VOUCHERS.find((voucher) => voucher.code === code);
    if (!coupon || coupon.isActive === false || coupon.active === false || (coupon.expiresAt && new Date(coupon.expiresAt) < new Date())) throw new Error('The coupon is invalid or expired.');
    const minimumOrder = Number(coupon.minimumOrderValue ?? coupon.minPurchase ?? coupon.minOrder ?? 0);
    const itemCount = pricedItems.reduce((sum, item) => sum + item.quantity, 0);
    if (subtotal < minimumOrder || (coupon.minItems && itemCount < Number(coupon.minItems))) throw new Error('Your cart does not meet this coupon’s minimum order requirements.');
    if (coupon.usageLimit && Number(coupon.usageCount || 0) >= coupon.usageLimit) throw new Error('This coupon has reached its usage limit.');
    const value = Number(coupon.value) || 0;
    discountAmount = ['FIXED', 'fixed'].includes(coupon.type) ? Math.min(subtotal, value) : Math.round((subtotal * value) / 100);
    if (coupon.maximumDiscount) discountAmount = Math.min(discountAmount, coupon.maximumDiscount);
    normalizedCoupon = code;
  }

  const shippingFee = subtotal === 0 || subtotal >= 499 ? 0 : 49;
  const prepaidDiscount = String(paymentMethod).toLowerCase().includes('upi') ? 50 : 0;
  const total = Math.max(0, subtotal - discountAmount - prepaidDiscount + shippingFee);
  return { items: pricedItems, subtotal, discountAmount: discountAmount + prepaidDiscount, couponCode: normalizedCoupon, shippingFee, total };
}
