import crypto from 'crypto';
import { connectDb } from './db.js';
import mongoose from 'mongoose';

export const CUSTOMER_COOKIE_NAME = 'satva_customer_session';

const getSecret = () =>
  process.env.AUTH_SECRET ||
  'satvastones-demi-fine-atelier-customer-secret-key-2026';

/**
 * Creates a signed customer session token (valid 30 days).
 */
export function createCustomerToken(user = {}) {
  const sessionData = {
    sub: user.id || user._id?.toString() || user.googleId || '',
    email: (user.email || '').toLowerCase().trim(),
    name: user.name || 'Valued Client',
    avatar: user.avatar || user.image || '',
    role: user.role || 'CUSTOMER',
    iat: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  const payloadB64 = Buffer.from(JSON.stringify(sessionData)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies a customer session token.
 */
export function verifyCustomerToken(token) {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', getSecret())
      .update(payloadB64)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

    if (!payload.exp || Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Finds or upserts a user from Google OAuth profile data into MongoDB `users`.
 */
export async function syncGoogleUser({ googleId, name, email, avatar }) {
  if (!email) throw new Error('Email is required to sync Google user.');
  await connectDb();

  const cleanEmail = email.toLowerCase().trim();
  const usersColl = mongoose.connection.db.collection('users');

  let existing = await usersColl.findOne({
    $or: [{ email: cleanEmail }, { googleId }],
  });

  if (existing) {
    const update = {
      name: existing.name && existing.name !== 'Valued Client' ? existing.name : (name || existing.name),
      avatar: avatar || existing.avatar || existing.image,
      lastLogin: new Date(),
      updatedAt: new Date(),
    };
    if (googleId && !existing.googleId) {
      update.googleId = googleId;
    }

    await usersColl.updateOne({ _id: existing._id }, { $set: update });
    existing = { ...existing, ...update };
  } else {
    const newUser = {
      name: name || cleanEmail.split('@')[0],
      email: cleanEmail,
      googleId: googleId || '',
      avatar: avatar || '',
      role: 'CUSTOMER',
      addresses: [],
      orders: [],
      wishlist: [],
      rewardPoints: 50, // Welcome reward bonus
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date(),
    };

    const insertResult = await usersColl.insertOne(newUser);
    existing = { ...newUser, _id: insertResult.insertedId };
  }

  // Also query past orders for this customer from MongoDB
  const pastOrders = await mongoose.connection.db
    .collection('orders')
    .find({
      $or: [
        { 'customer.email': cleanEmail },
        { 'shippingAddress.email': cleanEmail },
        { guestEmail: cleanEmail },
      ],
    })
    .sort({ createdAt: -1 })
    .toArray();

  const totalSpend = pastOrders.reduce((sum, o) => sum + Number(o.amount || o.total || 0), 0);
  const ordersCount = pastOrders.length;

  return {
    id: existing._id.toString(),
    _id: existing._id.toString(),
    name: existing.name,
    email: existing.email,
    avatar: existing.avatar || existing.image || '',
    role: existing.role || 'CUSTOMER',
    addresses: existing.addresses || [],
    ordersCount,
    totalSpend,
    joinedDate: existing.createdAt
      ? new Date(existing.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Nov 2026',
    status: totalSpend >= 2000 ? 'VIP Platinum Tier' : ordersCount >= 2 ? 'Loyal Patron' : 'Verified Client',
    provider: 'google',
  };
}
