import { NextResponse } from 'next/server';
import { connectDb } from '@/lib/db';
import mongoose from 'mongoose';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;
    await connectDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';

    // 1. Fetch users, customers, and orders from MongoDB Atlas
    const [dbUsers, dbCustomers, dbOrders] = await Promise.all([
      mongoose.connection.db.collection('users').find({}).toArray().catch(() => []),
      mongoose.connection.db.collection('customers').find({}).toArray().catch(() => []),
      mongoose.connection.db.collection('orders').find({}).sort({ createdAt: -1 }).toArray().catch(() => []),
    ]);

    // Map to aggregate by identifier (email or phone or id)
    const clientMap = new Map();

    const getPrimaryId = (email, phone, name, fallbackId) => {
      const e = email?.trim()?.toLowerCase();
      if (e) return `email:${e}`;
      const p = phone?.replace(/[^0-9]/g, '');
      if (p && p.length >= 7) return `phone:${p}`;
      const n = name?.trim()?.toLowerCase();
      if (n) return `name:${n}`;
      return `id:${fallbackId}`;
    };

    // Helper to format an address object
    const formatAddress = (addr) => {
      if (!addr) return null;
      if (typeof addr === 'string') {
        return {
          address: addr,
          city: '',
          state: '',
          pincode: '',
          country: 'India',
          formatted: addr,
        };
      }
      const street = addr.addressLine1 || addr.address || '';
      const street2 = addr.addressLine2 || '';
      const fullStreet = [street, street2].filter(Boolean).join(', ');
      const city = addr.city || '';
      const state = addr.state || '';
      const pincode = addr.pincode || addr.postalCode || '';
      const country = addr.country || 'India';
      const parts = [fullStreet, city, state ? `${state} - ${pincode}` : pincode, country].filter(Boolean);

      return {
        address: fullStreet,
        city,
        state,
        pincode,
        country,
        formatted: parts.join(', ') || 'Address not provided',
      };
    };

    // A. Seed with Users
    dbUsers.forEach((u) => {
      const email = u.email?.trim()?.toLowerCase() || '';
      const phone = u.phone || u.addresses?.[0]?.phone || '';
      const name = u.name || u.addresses?.[0]?.fullName || 'Verified Client';
      const key = getPrimaryId(email, phone, name, u._id.toString());

      const addresses = [];
      if (Array.isArray(u.addresses)) {
        u.addresses.forEach((a) => {
          const fa = formatAddress(a);
          if (fa) addresses.push(fa);
        });
      }

      clientMap.set(key, {
        id: u._id.toString(),
        name,
        email,
        phone,
        addresses,
        ordersCount: 0,
        totalSpend: 0,
        orders: [],
        authProvider: u.googleId || u.image ? 'Google Verified' : 'Registered Member',
        avatar: u.avatar || u.image || null,
        role: u.role || 'CUSTOMER',
        joinedDate: u.createdAt
          ? new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Nov 2026',
        lastActive: u.updatedAt || u.createdAt || new Date(),
      });
    });

    // B. Merge with Customers collection
    dbCustomers.forEach((c) => {
      const email = c.email?.trim()?.toLowerCase() || '';
      const phone = c.phone || '';
      const name = c.name || 'Client';
      const key = getPrimaryId(email, phone, name, c._id.toString());

      if (!clientMap.has(key)) {
        clientMap.set(key, {
          id: c._id.toString(),
          name,
          email,
          phone,
          addresses: [],
          ordersCount: 0,
          totalSpend: 0,
          orders: [],
          authProvider: 'Registered Account',
          avatar: null,
          role: 'CUSTOMER',
          joinedDate: c.createdAt
            ? new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'Nov 2026',
          lastActive: c.createdAt || new Date(),
        });
      }
    });

    // C. Aggregate Orders Data
    dbOrders.forEach((o) => {
      const name =
        o.customer?.fullName ||
        o.customer?.name ||
        o.shippingAddress?.fullName ||
        o.customerName ||
        'Valued Client';

      const email =
        o.customer?.email?.trim()?.toLowerCase() ||
        o.shippingAddress?.email?.trim()?.toLowerCase() ||
        o.guestEmail?.trim()?.toLowerCase() ||
        '';

      const phone =
        o.customer?.phone ||
        o.shippingAddress?.phone ||
        o.customerPhone ||
        '';

      const key = getPrimaryId(email, phone, name, o._id.toString());

      const orderAmount = Number(o.amount || o.total || 0);
      const orderDate = o.createdAt ? new Date(o.createdAt) : new Date();

      const addrObj = formatAddress(
        o.shippingAddress || {
          address: o.customer?.address,
          city: o.customer?.city,
          state: o.customer?.state,
          pincode: o.customer?.pincode,
        }
      );

      if (!clientMap.has(key)) {
        clientMap.set(key, {
          id: o._id.toString(),
          name,
          email,
          phone,
          addresses: addrObj ? [addrObj] : [],
          ordersCount: 0,
          totalSpend: 0,
          orders: [],
          authProvider: 'Order Customer',
          avatar: null,
          role: 'CUSTOMER',
          joinedDate: orderDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          lastActive: orderDate,
        });
      }

      const clientRecord = clientMap.get(key);

      // Upgrade name and phone if record had generic values
      if (name && (!clientRecord.name || clientRecord.name === 'Verified Client' || clientRecord.name === 'Client')) {
        clientRecord.name = name;
      }
      if (phone && !clientRecord.phone) {
        clientRecord.phone = phone;
      }
      if (email && !clientRecord.email) {
        clientRecord.email = email;
      }

      // Add address if unique
      if (addrObj && addrObj.formatted && addrObj.formatted !== 'Address not provided') {
        const exists = clientRecord.addresses.some(
          (a) => a.formatted?.toLowerCase() === addrObj.formatted?.toLowerCase()
        );
        if (!exists) {
          clientRecord.addresses.unshift(addrObj);
        }
      }

      clientRecord.ordersCount += 1;
      clientRecord.totalSpend += orderAmount;
      clientRecord.orders.push({
        id: o._id.toString(),
        orderNumber: o.orderNumber || `SAT-${o._id.toString().slice(-4).toUpperCase()}`,
        amount: orderAmount,
        status: o.status || o.orderStatus || 'Confirmed',
        date: orderDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        itemsCount: (o.items || []).length,
        paymentMethod: o.paymentMethod || 'Razorpay',
      });

      if (!clientRecord.lastActive || orderDate > new Date(clientRecord.lastActive)) {
        clientRecord.lastActive = orderDate;
      }
    });

    // Format list
    let customers = Array.from(clientMap.values()).map((c) => {
      let tier = 'Active Member';
      if (c.totalSpend >= 2000) {
        tier = 'VIP Platinum Tier';
      } else if (c.ordersCount >= 2 || c.totalSpend >= 1000) {
        tier = 'Loyal Patron';
      } else if (c.ordersCount === 1) {
        tier = 'First Order';
      }

      return {
        ...c,
        status: tier,
        defaultAddress: c.addresses[0] || null,
      };
    });

    // Sort by totalSpend desc or ordersCount desc
    customers.sort((a, b) => b.totalSpend - a.totalSpend || b.ordersCount - a.ordersCount);

    // Apply search filter if query provided
    if (search) {
      customers = customers.filter(
        (c) =>
          c.name?.toLowerCase().includes(search) ||
          c.email?.toLowerCase().includes(search) ||
          c.phone?.includes(search) ||
          c.addresses?.some((a) => a.formatted?.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (err) {
    console.error('API /api/customers error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
