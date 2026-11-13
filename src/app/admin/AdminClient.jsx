'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  PackageCheck,
  AlertCircle,
  TrendingUp,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit3,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff,
  X,
  Tag,
  Users,
  Search,
  CheckCircle2,
  ShieldCheck,
  Globe,
  SlidersHorizontal,
  Database,
  Layers,
  ImagePlus,
  Check,
  Lock,
  Unlock,
  LogOut,
  Phone,
  Mail,
  Copy,
  MapPin,
  ShoppingBag,
  MessageSquare,
} from 'lucide-react';
import { useCart, DEFAULT_PROMO_BANNERS, DEFAULT_VOUCHERS } from '../../context/CartContext';
import { products as fallbackInitialProducts } from '../../data/products';
import CloudinaryUploadButton from '../../components/CloudinaryUploadButton';
import './page.css';

const initialOrdersQueue = [
  {
    id: "SATVA-89241",
    client: "Radhika Apte",
    city: "Mumbai, MH",
    items: "Herringbone Chain + Roman Numeral Bangle",
    value: 1098,
    payment: "COD",
    status: "Pending Dispatch",
    created: "22 mins ago",
  },
  {
    id: "SATVA-89240",
    client: "Meera Nair",
    city: "Bengaluru, KA",
    items: "The Parisian Everyday Stack (3 pcs)",
    value: 1199,
    payment: "UPI Prepaid",
    status: "Ready for Courier",
    created: "1 hour ago",
  },
  {
    id: "SATVA-89239",
    client: "Ananya Deshmukh",
    city: "Pune, MH",
    items: "Modern Solitaire Mangalsutra",
    value: 649,
    payment: "COD",
    status: "In Transit (Bluedart)",
    created: "3 hours ago",
  },
  {
    id: "SATVA-89238",
    client: "Shreya Sen",
    city: "Kolkata, WB",
    items: "Seoul Blossom Pearl Drop Earrings",
    value: 299,
    payment: "UPI Prepaid",
    status: "Delivered",
    created: "Yesterday",
  },
];

const inventoryAlerts = [
  {
    id: 104,
    title: "Dainty Evil Eye Solitaire Pendant",
    category: "Chains",
    stock: 3,
    status: "Critical Low",
  },
  {
    id: 204,
    title: "Minimal Geometric Wave Open Ring",
    category: "Korean Rings",
    stock: 5,
    status: "Restock Advised",
  },
  {
    id: 101,
    title: "18K Gold Plated Serpent Herringbone Chain",
    category: "Bestseller Chain",
    stock: 42,
    status: "Healthy",
  },
];

const PRESET_BANNER_IMAGES = [
  {
    label: "Gold Chains Flatlay",
    url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1920&q=80",
  },
  {
    label: "Stacking Rings & Bangles",
    url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1920&q=80",
  },
  {
    label: "Minimalist Pearl Hoops",
    url: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1920&q=80",
  },
  {
    label: "Indian Heritage & Kundan",
    url: "https://images.unsplash.com/photo-1611591475155-426c04384a67?auto=format&fit=crop&w=1920&q=80",
  },
  {
    label: "Fine Gemstones & Silk",
    url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1920&q=80",
  },
  {
    label: "Solitaire Gold Pendant",
    url: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=1920&q=80",
  },
];

const QUICK_REDIRECT_OPTIONS = [
  { label: "Anti-Tarnish Collection", url: "/anti-tarnish-jewellery" },
  { label: "Waterproof Jewellery", url: "/waterproof-jewellery" },
  { label: "The Layering Edit (Sale)", url: "/sale" },
  { label: "Korean Minimalist", url: "/korean-jewellery" },
  { label: "Indian Heritage", url: "/indian-jewellery" },
  { label: "Western & Stacking", url: "/western-jewellery" },
  { label: "Atelier Journal", url: "/journal" },
  { label: "Care & PVD Guide", url: "/jewellery-care" },
  { label: "Serpent Herringbone Chain", url: "/products/101" },
  { label: "Roman Numeral Bangle", url: "/products/103" },
];

const PRESET_CATEGORY_IMAGES = [
  {
    label: "Anti-Tarnish Clover Chain",
    url: "https://res.cloudinary.com/dqguetjwm/image/upload/v1777868866/lkbtrxli6hvd3vuljynp.jpg",
  },
  {
    label: "Korean Pearl Drop",
    url: "https://res.cloudinary.com/dqguetjwm/image/upload/v1777861251/hjczebutzkna4fa9sose.png",
  },
  {
    label: "Tiara Crown Stacking Ring",
    url: "https://res.cloudinary.com/dqguetjwm/image/upload/v1777869918/ijtndbmsvdt9tiudvdsm.jpg",
  },
  {
    label: "Indian Lotus Motif Jhumka",
    url: "https://res.cloudinary.com/dqguetjwm/image/upload/v1777860481/e0g0gvxrar3ycuvthjz4.png",
  },
  {
    label: "Geometric Gold Kada Bangle",
    url: "https://res.cloudinary.com/dqguetjwm/image/upload/v1777860989/p9z2hxpcfksy25gcc1uf.png",
  },
  {
    label: "Mother's Day Gift Hamper",
    url: "https://res.cloudinary.com/dqguetjwm/image/upload/v1777711970/rglj3nkhqg8unjmakssj.jpg",
  },
];

export default function AdminClient({ initialAuthenticated = false, initialAdminEmail = '' }) {
  const {
    orders: liveOrders,
    promoBanners = DEFAULT_PROMO_BANNERS,
    addPromoBanner,
    updatePromoBanner,
    deletePromoBanner,
    toggleBannerActive,
    moveBanner,
    resetBannersToDefault,
    vouchers = DEFAULT_VOUCHERS,
    addVoucher,
    deleteVoucher,
    toggleVoucherActive,
    resetVouchersToDefault,
    registeredUsers = [],
  } = useCart();

  // Admin Authentication & Session State
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuthenticated);
  const [adminEmail, setAdminEmail] = useState(initialAdminEmail || 'admin@satvastones.in');
  const [authEmail, setAuthEmail] = useState(initialAdminEmail || 'techmax1245@gmail.com');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Live Customers State (from MongoDB Atlas)
  const [dbCustomers, setDbCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  // Selected Order for Details Modal
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // Selected Customer for Profile Modal
  const [selectedCustomerProfile, setSelectedCustomerProfile] = useState(null);

  // Copy Feedback Tracking
  const [copiedKey, setCopiedKey] = useState(null);

  // Live Tracking Number updating
  const [editingTrackingOrderId, setEditingTrackingOrderId] = useState(null);
  const [trackingInputVal, setTrackingInputVal] = useState('');
  const [savingTracking, setSavingTracking] = useState(false);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2500);
  };

  const [activeTab, setActiveTab] = useState('products'); // Default to Product Database
  const [filterStatus, setFilterStatus] = useState('all');
  const [customerSearch, setCustomerSearch] = useState('');

  // Product Database State (Live MongoDB Atlas + Fallback)
  const [catalogProducts, setCatalogProducts] = useState(fallbackInitialProducts);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    title: '',
    price: 499,
    mrp: 1499,
    category: 'anti-tarnish',
    subcategory: 'necklaces',
    material: '18K Gold Plated 316L Surgical Steel',
    stock: 15,
    image: '',
    tags: 'anti-tarnish, waterproof',
    description: '',
  });

  // Live MongoDB Atlas State Hooks
  const [apiOrders, setApiOrders] = useState([]);
  const [bannersList, setBannersList] = useState(promoBanners);
  const [apiCoupons, setApiCoupons] = useState(vouchers);

  // Categories Manager State (Homepage "Shop by category" & Catalog Navigation)
  const [categoriesList, setCategoriesList] = useState([]);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    id: null,
    name: '',
    slug: '',
    description: '',
    href: '/anti-tarnish-jewellery',
    imageUrl: PRESET_CATEGORY_IMAGES[0].url,
    sortOrder: 0,
    isFeatured: true,
    isPublished: true,
  });

  const fetchOrders = () => {
    fetch('/api/orders')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.orders && data.orders.length > 0) {
          setApiOrders(data.orders);
        }
      })
      .catch(() => {});
  };

  const fetchCustomers = () => {
    setCustomersLoading(true);
    fetch('/api/customers')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.customers && data.customers.length > 0) {
          setDbCustomers(data.customers);
        }
      })
      .catch(() => {})
      .finally(() => setCustomersLoading(false));
  };

  // Resolve an existing session before requesting any admin-only resources.
  useEffect(() => {
    if (!initialAuthenticated) {
      fetch('/api/admin/auth')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.authenticated) {
            setIsAuthenticated(true);
            if (data.user?.email) {
              setAdminEmail(data.user.email);
              setAuthEmail(data.user.email);
            }
          }
        })
        .catch(() => {});
    }
  }, [initialAuthenticated]);

  // Only load protected admin data after the server confirms the session or login succeeds.
  useEffect(() => {
    if (!isAuthenticated) return;

    const safeJson = (res) => {
      if (!res.ok) return null;
      const ct = res.headers.get('content-type') || '';
      return ct.includes('application/json') ? res.json() : null;
    };

    // 1. Live Products
    fetch('/api/products')
      .then(safeJson)
      .then((data) => {
        if (data && data.products && data.products.length > 0) {
          setCatalogProducts(data.products);
        }
      })
      .catch(() => {});

    // 2. Live Banners
    fetch('/api/banners')
      .then(safeJson)
      .then((data) => {
        if (data && data.banners && data.banners.length > 0) {
          setBannersList(data.banners);
        }
      })
      .catch(() => {});

    // 3. Live Orders
    fetchOrders();

    // 4. Live Customers
    fetchCustomers();

    // 5. Live Coupons
    fetch('/api/coupons')
      .then(safeJson)
      .then((data) => {
        if (data && data.coupons && data.coupons.length > 0) {
          setApiCoupons(data.coupons);
        }
      })
      .catch(() => {});

    // 6. Live Categories
    fetch('/api/categories?all=true')
      .then(safeJson)
      .then((data) => {
        if (data && data.categories && data.categories.length > 0) {
          setCategoriesList(data.categories);
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

  // Filtered Products for Catalog Table
  const filteredCatalogProducts = useMemo(() => {
    return catalogProducts.filter((p) => {
      const matchSearch =
        !productSearch.trim() ||
        p.title?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.material?.toLowerCase().includes(productSearch.toLowerCase());

      const matchCategory =
        productCategoryFilter === 'all' ||
        p.category?.toLowerCase() === productCategoryFilter.toLowerCase() ||
        (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase() === productCategoryFilter.toLowerCase()));

      return matchSearch && matchCategory;
    });
  }, [catalogProducts, productSearch, productCategoryFilter]);

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      title: '',
      price: 499,
      mrp: 1499,
      category: 'anti-tarnish',
      subcategory: 'necklaces',
      material: '18K Gold Plated 316L Surgical Steel',
      stock: 15,
      image: '',
      tags: 'anti-tarnish, waterproof',
      description: '',
    });
    setIsAddingProduct(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      title: prod.title || prod.name || '',
      price: prod.price || 499,
      mrp: prod.mrp || prod.price * 2,
      category: prod.category || 'anti-tarnish',
      subcategory: prod.subcategory || 'jewellery',
      material: prod.material || '18K Gold Plated 316L Surgical Steel',
      stock: prod.stock ?? 10,
      image: prod.image || prod.images?.[0]?.secureUrl || '',
      tags: Array.isArray(prod.tags) ? prod.tags.join(', ') : prod.tags || '',
      description: prod.description || '',
    });
    setIsAddingProduct(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.title || !productForm.price) {
      alert('Please enter a product title and price.');
      return;
    }

    const payload = {
      ...productForm,
      price: Number(productForm.price),
      mrp: Number(productForm.mrp) || Number(productForm.price) * 2,
      stock: Number(productForm.stock) || 10,
      tags:
        typeof productForm.tags === 'string'
          ? productForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : productForm.tags,
    };

    if (editingProduct) {
      try {
        const res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingProduct.mongoId || editingProduct.id, ...payload }),
        });
        const data = await res.json();
        if (data.success) {
          setCatalogProducts((prev) =>
            prev.map((p) => (p.id === editingProduct.id ? { ...p, ...payload } : p))
          );
        }
      } catch (err) {
        console.error('Update error:', err);
      }
      setEditingProduct(null);
    } else {
      try {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success && data.product) {
          const created = {
            id: data.product._id || Date.now().toString(),
            mongoId: data.product._id,
            ...payload,
            sku: data.product.sku,
          };
          setCatalogProducts((prev) => [created, ...prev]);
        }
      } catch (err) {
        console.error('Create error:', err);
      }
    }
    setIsAddingProduct(false);
  };

  const handleDeleteProduct = async (id, mongoId) => {
    if (!confirm('Are you sure you want to delete this piece from MongoDB?')) return;
    try {
      await fetch(`/api/products?id=${mongoId || id}`, { method: 'DELETE' });
      setCatalogProducts((prev) => prev.filter((p) => p.id !== id && p.mongoId !== mongoId));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Promo Banner Form State (Pure Image Banner - No Overlaid Text or Buttons)
  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [bannerForm, setBannerForm] = useState({
    id: null,
    title: '',
    imageUrl: PRESET_BANNER_IMAGES[0].url,
    redirectUrl: '/anti-tarnish-jewellery',
    active: true,
  });

  // Voucher Form State
  const [isAddingVoucher, setIsAddingVoucher] = useState(false);
  const [voucherForm, setVoucherForm] = useState({
    code: '',
    type: 'fixed',
    value: 200,
    minOrder: 499,
    minItems: 0,
    description: '',
    expiry: '31 Dec 2026',
    active: true,
  });

  // Merge live MongoDB Atlas orders with session orders & historical orders
  const mergedOrders = useMemo(() => {
    const formattedApi = (apiOrders || []).map((o) => ({
      id: o.orderNumber || o.id,
      mongoId: o.id,
      client: o.customer || o.customerName || o.client || 'Client',
      customerName: o.customerName || o.customer || 'Client',
      email: o.email || '',
      phone: o.phone || '',
      address: o.address || '',
      city: o.city || '',
      state: o.state || '',
      pincode: o.pincode || '',
      country: o.country || 'India',
      fullAddress:
        o.fullAddress ||
        [o.address, o.city, o.state ? `${o.state} - ${o.pincode}` : o.pincode, o.country]
          .filter(Boolean)
          .join(', '),
      itemsList: o.items || [],
      items:
        (o.items || [])
          .map((it) => `${it.title || 'Piece'} × ${it.quantity || it.qty || 1}`)
          .join(', ') || 'Atelier Piece',
      value: o.amount || o.total || o.value || 0,
      subtotal: o.subtotal || o.amount || o.value || 0,
      discountAmount: o.discountAmount || 0,
      shippingFee: o.shippingFee || 0,
      couponCode: o.couponCode || '',
      payment: o.paymentMethod || 'Razorpay',
      paymentStatus: o.paymentStatus || 'COMPLETED',
      paymentId: o.paymentId || '',
      orderId: o.orderId || '',
      trackingId: o.trackingId || '',
      courierName: o.courierName || 'BlueDart Express',
      status: o.status || 'Confirmed',
      created: o.createdAt
        ? new Date(o.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : 'Recently',
      rawDate: o.createdAt,
    }));

    const formattedLive = (liveOrders || []).map((o) => ({
      id: o.orderId,
      mongoId: null,
      client: o.clientName || o.customer?.fullName || o.destination?.split(',')?.[0] || 'Client Order',
      customerName: o.clientName || o.customer?.fullName || 'Client Order',
      email: o.email || o.customer?.email || '',
      phone: o.phone || o.customer?.phone || '',
      address: o.destination || o.customer?.address || '',
      city: o.city || o.destination?.split(',')?.[1] || 'India',
      state: o.state || o.customer?.state || '',
      pincode: o.pincode || o.customer?.pincode || '',
      country: 'India',
      fullAddress: o.destination || 'Address on record',
      itemsList: o.items || [],
      items:
        o.items
          ?.map((it) => `${it.title?.split(' ')?.[0] || 'Piece'} × ${it.quantity || 1}`)
          .join(', ') || 'Atelier Jewellery',
      value: o.total,
      subtotal: o.subtotal || o.total,
      discountAmount: o.discountAmount || 0,
      shippingFee: o.shippingFee || 0,
      couponCode: o.couponCode || '',
      payment: o.paymentMethod?.includes('Cash') || o.paymentMethod === 'COD' ? 'COD' : 'UPI Prepaid',
      paymentStatus: 'CONFIRMED',
      paymentId: o.paymentId || '',
      orderId: o.orderId,
      trackingId: o.trackingId || '',
      courierName: 'BlueDart Express',
      status: o.status || 'Pending Dispatch',
      created: o.date || 'Just now',
      rawDate: new Date(),
    }));

    const existingIds = new Set([...formattedApi.map((o) => o.id), ...formattedLive.map((o) => o.id)]);
    const dedupedHistorical = initialOrdersQueue
      .filter((o) => !existingIds.has(o.id))
      .map((o) => ({
        ...o,
        customerName: o.client,
        email: 'client@satvastones.in',
        phone: '+91 98200 12345',
        address: `${o.client} Residence, ${o.city}`,
        state: o.city?.split(',')?.[1]?.trim() || '',
        pincode: '400001',
        country: 'India',
        fullAddress: `${o.client} Residence, ${o.city} - 400001, India`,
        itemsList: [{ title: o.items, quantity: 1, price: o.value, finish: '18K Gold Plated' }],
        subtotal: o.value,
        discountAmount: 0,
        shippingFee: 0,
        couponCode: '',
        paymentStatus: o.payment === 'COD' ? 'PENDING' : 'COMPLETED',
        trackingId: 'BD-88492019-IN',
        courierName: 'BlueDart Express',
      }));

    return [...formattedApi, ...formattedLive, ...dedupedHistorical];
  }, [apiOrders, liveOrders]);

  const [statusOverrides, setStatusOverrides] = useState({});

  const orders = useMemo(() => {
    return mergedOrders.map((ord) => ({
      ...ord,
      status: statusOverrides[ord.id] || ord.status,
    }));
  }, [mergedOrders, statusOverrides]);

  const advanceStatus = async (orderId) => {
    const ord = orders.find((o) => o.id === orderId);
    let next = ord?.status || 'Pending Dispatch';
    const s = next.toLowerCase();
    if (s.includes('pending') || s.includes('confirmed') || s.includes('paid')) next = 'Ready for Courier';
    else if (s.includes('ready') || s.includes('packed') || s.includes('processing')) next = 'In Transit (Bluedart)';
    else if (s.includes('transit') || s.includes('dispatched')) next = 'Delivered';

    setStatusOverrides((prev) => ({ ...prev, [orderId]: next }));

    // Persist status advance to MongoDB Atlas
    try {
      await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderId,
          status: next,
        }),
      });
    } catch (err) {
      console.error('Order status advance error:', err);
    }
  };

  const handleSaveTracking = async (orderId, trackingId) => {
    setSavingTracking(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderId,
          trackingId: (trackingId || '').trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingTrackingOrderId(null);
        fetchOrders();
        if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
          setSelectedOrderDetails((prev) => ({ ...prev, trackingId: (trackingId || '').trim() }));
        }
      }
    } catch (err) {
      console.error('Failed to update tracking ID:', err);
    } finally {
      setSavingTracking(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: authEmail.trim(),
          password: authPassword.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setAdminEmail(data.user?.email || authEmail);
        setAuthPassword('');
        setAuthError('');
      } else {
        setAuthError(data.error || 'Access denied. Master password incorrect.');
      }
    } catch (err) {
      setAuthError('Connection error. Could not verify credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsAuthenticated(false);
      setAuthPassword('');
    }
  };

  const filteredOrders =
    filterStatus === 'all'
      ? orders
      : orders.filter((o) => o.status.toLowerCase().includes(filterStatus.toLowerCase()));

  // Unified Customers List (combines /api/customers from MongoDB with session data)
  const unifiedCustomers = useMemo(() => {
    if (dbCustomers && dbCustomers.length > 0) {
      return dbCustomers;
    }
    const map = new Map();
    (orders || []).forEach((o) => {
      const email = o.email?.toLowerCase();
      const phone = o.phone;
      const key = email || phone || o.client;
      if (!map.has(key)) {
        map.set(key, {
          id: o.id,
          name: o.client,
          email: o.email || 'client@satvastones.in',
          phone: o.phone || '',
          addresses: [
            {
              address: o.address,
              city: o.city,
              state: o.state,
              pincode: o.pincode,
              formatted: o.fullAddress,
            },
          ],
          defaultAddress: {
            address: o.address,
            city: o.city,
            state: o.state,
            pincode: o.pincode,
            formatted: o.fullAddress,
          },
          ordersCount: 1,
          totalSpend: o.value,
          orders: [{ id: o.id, orderNumber: o.id, amount: o.value, status: o.status, date: o.created }],
          authProvider: 'Order Customer',
          status: o.value >= 2000 ? 'VIP Platinum Tier' : 'Active Member',
          joinedDate: o.created,
        });
      } else {
        const c = map.get(key);
        c.ordersCount += 1;
        c.totalSpend += o.value;
        c.orders.push({ id: o.id, orderNumber: o.id, amount: o.value, status: o.status, date: o.created });
      }
    });

    (registeredUsers || []).forEach((u) => {
      const email = u.email?.toLowerCase();
      if (!map.has(email)) {
        map.set(email, {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.addresses?.[0]?.phone || '',
          addresses: u.addresses || [],
          defaultAddress: u.addresses?.[0] || null,
          ordersCount: u.ordersCount || 0,
          totalSpend: u.totalSpend || 0,
          orders: [],
          authProvider: 'Google Verified',
          status: u.status || 'Active Member',
          joinedDate: u.joinedDate || 'Nov 2026',
        });
      }
    });

    return Array.from(map.values());
  }, [dbCustomers, orders, registeredUsers]);

  // Filtered Customers based on search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return unifiedCustomers;
    const term = customerSearch.toLowerCase();
    return unifiedCustomers.filter((u) => {
      const matchName = u.name?.toLowerCase().includes(term);
      const matchEmail = u.email?.toLowerCase().includes(term);
      const matchPhone = u.phone?.includes(term);
      const matchCity = u.defaultAddress?.city?.toLowerCase().includes(term);
      const matchAddr = u.defaultAddress?.formatted?.toLowerCase().includes(term);
      return matchName || matchEmail || matchPhone || matchCity || matchAddr;
    });
  }, [unifiedCustomers, customerSearch]);

  // Metrics
  const totalRevenueToday = orders.reduce((acc, o) => acc + o.value, 0);
  const averageOrderValue = Math.round(totalRevenueToday / Math.max(1, orders.length));
  const codSharePercent = Math.round(
    (orders.filter((o) => o.payment === 'COD').length / Math.max(1, orders.length)) * 100
  );
  const activeBannersCount = promoBanners.filter((b) => b.active).length;

  // Handle Banner Form Actions
  const handleOpenNewBanner = () => {
    setBannerForm({
      id: null,
      title: 'New Campaign Banner',
      imageUrl: PRESET_BANNER_IMAGES[0].url,
      redirectUrl: '/anti-tarnish-jewellery',
      active: true,
    });
    setIsEditingBanner(true);
  };

  const handleEditBanner = (banner) => {
    setBannerForm({
      id: banner.id,
      title: banner.title || 'Campaign Banner',
      imageUrl: banner.imageUrl || PRESET_BANNER_IMAGES[0].url,
      redirectUrl: banner.redirectUrl || '/anti-tarnish-jewellery',
      active: banner.active !== false,
    });
    setIsEditingBanner(true);
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    if (!bannerForm.imageUrl.trim()) {
      alert('Please provide a banner image URL.');
      return;
    }
    if (!bannerForm.redirectUrl.trim()) {
      alert('Please specify a redirect URL (e.g. /anti-tarnish-jewellery).');
      return;
    }

    try {
      if (bannerForm.id && !String(bannerForm.id).startsWith('banner-')) {
        // Update in MongoDB
        const res = await fetch('/api/banners', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: bannerForm.id,
            title: bannerForm.title,
            imageUrl: bannerForm.imageUrl,
            redirectUrl: bannerForm.redirectUrl,
            active: bannerForm.active,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setBannersList((prev) =>
            prev.map((b) => (b.id === bannerForm.id ? { ...b, ...bannerForm } : b))
          );
        }
      } else {
        // Create in MongoDB
        const res = await fetch('/api/banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: bannerForm.title,
            imageUrl: bannerForm.imageUrl,
            redirectUrl: bannerForm.redirectUrl,
            active: bannerForm.active,
          }),
        });
        const data = await res.json();
        if (data.success && data.banner) {
          const created = {
            id: data.banner._id,
            title: data.banner.title,
            imageUrl: data.banner.imageUrl || data.banner.image?.secureUrl,
            redirectUrl: data.banner.redirectUrl,
            active: data.banner.active,
          };
          setBannersList((prev) => [created, ...prev]);
        }
      }
      updatePromoBanner(bannerForm.id, bannerForm);
    } catch (err) {
      console.error('Save banner error:', err);
    }
    setIsEditingBanner(false);
  };

  const displayedBanners = bannersList && bannersList.length > 0 ? bannersList : promoBanners;

  const handleDeleteBanner = async (bannerId) => {
    if (!confirm('Are you sure you want to remove this promo banner?')) return;
    try {
      if (!String(bannerId).startsWith('banner-')) {
        await fetch(`/api/banners?id=${bannerId}`, { method: 'DELETE' });
      }
      setBannersList((prev) => prev.filter((b) => b.id !== bannerId));
      deletePromoBanner(bannerId);
    } catch (err) {
      console.error('Delete banner error:', err);
    }
  };

  // Category Management Handlers
  const handleOpenNewCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      id: null,
      name: '',
      slug: '',
      description: '',
      href: '/anti-tarnish-jewellery',
      imageUrl: PRESET_CATEGORY_IMAGES[0].url,
      sortOrder: categoriesList.length,
      isFeatured: true,
      isPublished: true,
    });
    setIsEditingCategory(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      id: cat.id || cat._id,
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || cat.count || '',
      href: cat.href || (cat.slug ? `/${cat.slug}` : '/anti-tarnish-jewellery'),
      imageUrl: cat.imageUrl || cat.image || '',
      sortOrder: cat.sortOrder ?? 0,
      isFeatured: cat.isFeatured !== false,
      isPublished: cat.isPublished !== false,
    });
    setIsEditingCategory(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      alert('Please provide a category name.');
      return;
    }

    try {
      if (categoryForm.id && !String(categoryForm.id).startsWith('cat-temp-')) {
        // Update in MongoDB
        const res = await fetch('/api/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: categoryForm.id,
            name: categoryForm.name,
            slug: categoryForm.slug,
            description: categoryForm.description,
            href: categoryForm.href,
            image: categoryForm.imageUrl,
            sortOrder: Number(categoryForm.sortOrder) || 0,
            isFeatured: categoryForm.isFeatured,
            isPublished: categoryForm.isPublished,
          }),
        });
        const data = await res.json();
        if (data.success && data.category) {
          setCategoriesList((prev) =>
            prev.map((c) => ((c.id === categoryForm.id || c._id === categoryForm.id) ? data.category : c))
          );
        }
      } else {
        // Create in MongoDB
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: categoryForm.name,
            slug: categoryForm.slug,
            description: categoryForm.description,
            href: categoryForm.href,
            image: categoryForm.imageUrl,
            sortOrder: Number(categoryForm.sortOrder) || categoriesList.length,
            isFeatured: categoryForm.isFeatured,
            isPublished: categoryForm.isPublished,
          }),
        });
        const data = await res.json();
        if (data.success && data.category) {
          setCategoriesList((prev) => [...prev, data.category]);
        }
      }
      setIsEditingCategory(false);
    } catch (err) {
      console.error('Save category error:', err);
    }
  };

  const handleDeleteCategory = async (cat) => {
    const id = cat.id || cat._id;
    if (!confirm(`Are you sure you want to remove category "${cat.name}"?`)) return;
    try {
      await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      setCategoriesList((prev) => prev.filter((c) => c.id !== id && c._id !== id));
    } catch (err) {
      console.error('Delete category error:', err);
    }
  };

  const handleToggleCategoryFeatured = async (cat) => {
    const id = cat.id || cat._id;
    const nextFeatured = !(cat.isFeatured !== false);
    try {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          isFeatured: nextFeatured,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCategoriesList((prev) =>
          prev.map((c) => ((c.id === id || c._id === id) ? { ...c, isFeatured: nextFeatured } : c))
        );
      }
    } catch (err) {
      console.error('Toggle category featured error:', err);
    }
  };

  const reloadCategories = () => {
    fetch('/api/categories?all=true')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.categories) {
          setCategoriesList(data.categories);
        }
      })
      .catch((err) => console.error('Reload error:', err));
  };

  // Handle Voucher Creation
  const handleSaveVoucher = async (e) => {
    e.preventDefault();
    if (!voucherForm.code.trim()) {
      alert('Please provide a voucher code.');
      return;
    }
    const cleanCode = voucherForm.code.trim().toUpperCase();
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          type: voucherForm.type === 'percent' ? 'PERCENTAGE' : 'FIXED',
          value: Number(voucherForm.value) || 0,
          minPurchase: Number(voucherForm.minOrder) || 0,
          description: voucherForm.description || '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        addVoucher({
          ...voucherForm,
          code: cleanCode,
          value: Number(voucherForm.value) || 0,
          minOrder: Number(voucherForm.minOrder) || 0,
        });
        setApiCoupons((prev) => [data.coupon, ...prev]);
        setIsAddingVoucher(false);
      } else {
        alert(data.error || 'Failed to create coupon in database.');
      }
    } catch (err) {
      console.error('Coupon create error:', err);
    }
    setIsAddingVoucher(false);
    setVoucherForm({
      code: '',
      type: 'fixed',
      value: 200,
      minOrder: 499,
      minItems: 0,
      description: '',
      expiry: '31 Dec 2026',
      active: true,
    });
  };

  // 1. Password Protection Gate for Admin Portal
  if (!isAuthenticated) {
    return (
      <div className="admin-page-shell admin-lock-shell">
        <div className="admin-lock-card">
          <div className="admin-lock-header">
            <div className="admin-lock-icon-circle">
              <Lock size={28} />
            </div>
            <span className="admin-brand-tag">SATVASTONES ATELIER</span>
            <h1 className="admin-lock-title">Merchant Operations Portal</h1>
            <p className="admin-lock-desc">
              Restricted management area for customer order dispatch, customer database, and atelier catalog. Enter master administrator authorization key.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="admin-lock-form">
            {authError && (
              <div className="admin-lock-alert">
                <AlertCircle size={16} />
                <span>{authError}</span>
              </div>
            )}

            <div className="admin-lock-field">
              <label htmlFor="admin-email-input">Admin Email / Username</label>
              <div className="admin-input-icon-wrap">
                <Mail size={16} className="admin-field-icon" />
                <input
                  id="admin-email-input"
                  type="text"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="techmax1245@gmail.com or admin@satvastones.in"
                  className="admin-lock-input"
                  required
                />
              </div>
            </div>

            <div className="admin-lock-field">
              <div className="admin-lock-label-row">
                <label htmlFor="admin-password-input">Master Key / Password</label>
              </div>
              <div className="admin-input-icon-wrap">
                <Lock size={16} className="admin-field-icon" />
                <input
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Enter master password"
                  className="admin-lock-input"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  className="admin-pw-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="admin-lock-submit-btn"
            >
              {authLoading ? (
                <>
                  <RefreshCw size={16} className="spin-icon" />
                  <span>Verifying Master Credentials...</span>
                </>
              ) : (
                <>
                  <Unlock size={16} />
                  <span>Unlock Atelier Portal</span>
                </>
              )}
            </button>
          </form>

          <div className="admin-lock-footer">
            <span className="admin-lock-security-note">
              <ShieldCheck size={14} /> End-to-end encrypted session • 256-bit HMAC Token Guard
            </span>
            <Link href="/" className="admin-lock-back-link">
              ← Return to Public Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-shell">
      {/* Top Operations Header */}
      <header className="admin-top-bar">
        <div className="container admin-bar-inner">
          <div className="admin-title-group">
            <div className="admin-logo-lockup">
              <Link href="/" target="_blank" aria-label="View Storefront">
                <Image
                  src="/logo-white.png"
                  alt="Satvastones"
                  width={140}
                  height={43}
                  className="admin-header-logo"
                />
              </Link>
              <span className="admin-brand-tag">Atelier Operations Center</span>
            </div>
            <h1 className="admin-page-heading">Merchant Storefront & Operations Engine</h1>
          </div>
          <div className="admin-quick-links">
            <div className="admin-auth-status-pill">
              <span className="admin-status-dot pulse" />
              <span className="admin-auth-email">{adminEmail}</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary admin-btn-sm admin-logout-btn"
              onClick={handleAdminLogout}
              title="Lock admin portal and sign out"
            >
              <Lock size={13} style={{ marginRight: 6 }} />
              <span>Lock Portal</span>
            </button>
            <Link href="/" className="btn btn-secondary admin-btn-sm" target="_blank">
              View Storefront <ExternalLink size={14} style={{ marginLeft: 6 }} />
            </Link>
          </div>
        </div>
      </header>

      <div className="container admin-dashboard-content">
        {/* Core Operations Metrics */}
        <div className="admin-metrics-grid">
          <div className="metric-tile highlight-gold">
            <span className="metric-label">MongoDB Atlas Database</span>
            <span className="metric-big-number">{catalogProducts.length} Pieces</span>
            <span className="metric-context">Live in satvastones database</span>
          </div>

          <div className="metric-tile">
            <span className="metric-label">Hero Promo Gallery</span>
            <span className="metric-big-number">{activeBannersCount} Active</span>
            <span className="metric-context">Of {promoBanners.length} configured banners</span>
          </div>

          <div className="metric-tile">
            <span className="metric-label">Active Vouchers</span>
            <span className="metric-big-number">{vouchers.filter((v) => v.active !== false).length} Codes</span>
            <span className="metric-context">Directly drives Cart & Checkout</span>
          </div>

          <div className="metric-tile">
            <span className="metric-label">Average Order Value (AOV)</span>
            <span className="metric-big-number">₹{averageOrderValue}</span>
            <span className="metric-context">{codSharePercent}% COD • {100 - codSharePercent}% UPI</span>
          </div>
        </div>

        {/* Master Navigation Tabs */}
        <div className="admin-tabs-nav" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'products'}
            className={`admin-tab-btn ${activeTab === 'products' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Database size={16} />
            <span>Product Database ({catalogProducts.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'promo-banners'}
            className={`admin-tab-btn ${activeTab === 'promo-banners' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('promo-banners')}
          >
            <ImageIcon size={16} />
            <span>Hero Promo Gallery ({promoBanners.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'categories'}
            className={`admin-tab-btn ${activeTab === 'categories' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <Layers size={16} />
            <span>Category Tiles ({categoriesList.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'vouchers'}
            className={`admin-tab-btn ${activeTab === 'vouchers' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('vouchers')}
          >
            <Tag size={16} />
            <span>Vouchers & Privileges ({vouchers.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'customers'}
            className={`admin-tab-btn ${activeTab === 'customers' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            <Users size={16} />
            <span>Customer Directory ({unifiedCustomers.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'seo'}
            className={`admin-tab-btn ${activeTab === 'seo' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('seo')}
          >
            <Globe size={16} />
            <span>Automated SEO & Schema</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'dispatch'}
            className={`admin-tab-btn ${activeTab === 'dispatch' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('dispatch')}
          >
            <PackageCheck size={16} />
            <span>Order Dispatch ({orders.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'inventory'}
            className={`admin-tab-btn ${activeTab === 'inventory' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <AlertCircle size={16} />
            <span>Inventory Stock</span>
          </button>
        </div>

        {/* TAB 0: PRODUCT DATABASE & CATALOG MANAGER (MongoDB Atlas) */}
        {activeTab === 'products' && (
          <section className="admin-card-section">
            <div className="admin-card-header">
              <div>
                <div className="db-connected-tag">
                  <Database size={14} className="text-forest" />
                  <span>MongoDB Atlas Connected: satvastones.products</span>
                </div>
                <h2 className="admin-card-title">Product Database &amp; Catalog</h2>
                <p className="admin-card-subtitle">
                  Manage live jewelry pieces, edit prices, update inventory stock, or upload high-resolution Cloudinary photos.
                </p>
              </div>

              <div className="admin-header-actions-row">
                <button
                  type="button"
                  className="btn btn-primary admin-btn-sm"
                  onClick={handleOpenAddProduct}
                >
                  <Plus size={15} style={{ marginRight: 6 }} /> Add Piece to Database
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="products-filter-toolbar">
              <div className="admin-search-box">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by title, SKU, or material..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="admin-search-input"
                />
              </div>

              <div className="admin-filter-bar">
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="admin-select"
                  aria-label="Filter by category"
                >
                  <option value="all">All Categories ({catalogProducts.length})</option>
                  <option value="anti-tarnish">Anti-Tarnish</option>
                  <option value="waterproof">Waterproof</option>
                  <option value="korean">Korean Minimalist</option>
                  <option value="indian">Indian Heritage</option>
                  <option value="western">Western &amp; Stacking</option>
                  <option value="earrings">Earrings</option>
                  <option value="necklaces">Necklaces</option>
                </select>
              </div>
            </div>

            {/* Product Add / Edit Modal Drawer */}
            {isAddingProduct && (
              <div className="banner-editor-card">
                <div className="editor-card-header">
                  <h3>{editingProduct ? 'Edit Product in MongoDB' : 'Add New Jewelry Piece to MongoDB'}</h3>
                  <button
                    type="button"
                    className="editor-close-btn"
                    onClick={() => setIsAddingProduct(false)}
                    aria-label="Cancel"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} className="product-form-grid">
                  <div className="form-row">
                    <div className="admin-field-group">
                      <label>Product Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 18K Gold Plated Paperclip Chain"
                        value={productForm.title}
                        onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                      />
                    </div>

                    <div className="admin-field-group">
                      <label>Base Material</label>
                      <input
                        type="text"
                        placeholder="e.g. 18K Gold Vacuum PVD over 316L Surgical Steel"
                        value={productForm.material}
                        onChange={(e) => setProductForm({ ...productForm, material: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row three-cols">
                    <div className="admin-field-group">
                      <label>Price (₹) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 499"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      />
                    </div>

                    <div className="admin-field-group">
                      <label>MRP Strikethrough (₹)</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 1499"
                        value={productForm.mrp}
                        onChange={(e) => setProductForm({ ...productForm, mrp: e.target.value })}
                      />
                    </div>

                    <div className="admin-field-group">
                      <label>Stock Available</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 15"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row three-cols">
                    <div className="admin-field-group">
                      <label>Category</label>
                      <select
                        value={productForm.category}
                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                        className="admin-select"
                      >
                        <option value="anti-tarnish">Anti-Tarnish</option>
                        <option value="korean">Korean Minimalist</option>
                        <option value="indian">Indian Heritage</option>
                        <option value="western">Western &amp; Stacking</option>
                        <option value="earrings">Earrings</option>
                      </select>
                    </div>

                    <div className="admin-field-group">
                      <label>Subcategory</label>
                      <input
                        type="text"
                        placeholder="e.g. necklaces, rings, earrings, bangles"
                        value={productForm.subcategory}
                        onChange={(e) => setProductForm({ ...productForm, subcategory: e.target.value })}
                      />
                    </div>

                    <div className="admin-field-group">
                      <label>Tags (Comma-separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. anti-tarnish, waterproof, hypoallergenic"
                        value={productForm.tags}
                        onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })}
                      />
                    </div>
                  </div>

                  <CloudinaryUploadButton
                    label="Product Photography (Cloudinary Upload)"
                    value={productForm.image}
                    onChange={(url) => setProductForm({ ...productForm, image: url })}
                    folder="satvastones/products"
                  />

                  <div className="admin-field-group">
                    <label>Product Description</label>
                    <textarea
                      rows={3}
                      placeholder="Material specifications, dimensions, shower safety guarantee..."
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    />
                  </div>

                  <div className="editor-actions-strip">
                    <button type="submit" className="btn btn-primary">
                      {editingProduct ? 'Save Changes to MongoDB' : 'Deploy Product to Database'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setIsAddingProduct(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Products Data Table */}
            <div className="orders-table-wrapper">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Product &amp; SKU</th>
                    <th>Category</th>
                    <th>Price / MRP</th>
                    <th>Material</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCatalogProducts.map((p) => {
                    const discount = p.mrp && p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
                    const imgSrc = p.image || p.images?.[0]?.secureUrl || '';
                    return (
                      <tr key={p.id || p.slug}>
                        <td>
                          <div className="product-table-thumb">
                            {imgSrc ? (
                              <Image
                                src={imgSrc}
                                alt={p.title || 'Product'}
                                width={44}
                                height={44}
                                className="table-thumb-img"
                                unoptimized
                              />
                            ) : (
                              <div className="table-thumb-placeholder" style={{ background: p.imageBg || '#f7efe2' }}>
                                <span>{p.title?.charAt(0)}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <strong>{p.title || p.name}</strong>
                          <span className="sku-sub-code">{p.sku || `SATVA-${p.id}`}</span>
                        </td>
                        <td>
                          <span className="category-pill-tag">{p.category || 'Jewellery'}</span>
                        </td>
                        <td>
                          <strong>₹{p.price}</strong>
                          {p.mrp && p.mrp > p.price && (
                            <span className="mrp-sub-discount">
                              ₹{p.mrp} ({discount}% off)
                            </span>
                          )}
                        </td>
                        <td className="material-cell">
                          <span>{p.material || '18K Gold 316L Steel'}</span>
                        </td>
                        <td>
                          <span className={`stock-count-chip ${(p.stock ?? 10) <= 5 ? 'is-low' : ''}`}>
                            {p.stock ?? 10} in stock
                          </span>
                        </td>
                        <td>
                          <div className="row-action-buttons">
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleOpenEditProduct(p)}
                              title="Edit product"
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                            <button
                              type="button"
                              className="action-icon-btn delete-btn"
                              onClick={() => handleDeleteProduct(p.id, p.mongoId)}
                              title="Delete from MongoDB"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 1: HERO PROMOTIONAL GALLERY MANAGER */}
        {activeTab === 'promo-banners' && (
          <section className="admin-card-section">
            <div className="admin-card-header">
              <div>
                <h2 className="admin-card-title">Homepage Hero Promotional Gallery</h2>
                <p className="admin-card-subtitle">
                  Pure promotional image gallery with zero overlaid text or buttons. Each banner redirects visitors to its designated destination page when clicked.
                </p>
              </div>

              <div className="admin-header-actions-row">
                <button
                  type="button"
                  className="btn btn-primary admin-btn-sm"
                  onClick={handleOpenNewBanner}
                >
                  <Plus size={15} style={{ marginRight: 6 }} /> Add Promo Banner
                </button>
                <button
                  type="button"
                  className="btn btn-secondary admin-btn-sm"
                  onClick={resetBannersToDefault}
                  title="Restore default campaign banners"
                >
                  <RefreshCw size={14} style={{ marginRight: 6 }} /> Reset Defaults
                </button>
              </div>
            </div>

            {/* Banner Editor / Creator Drawer */}
            {isEditingBanner && (
              <div className="banner-editor-card">
                <div className="editor-card-header">
                  <h3>{bannerForm.id ? 'Edit Promotional Banner' : 'Create New Promotional Banner'}</h3>
                  <button
                    type="button"
                    className="editor-close-btn"
                    onClick={() => setIsEditingBanner(false)}
                    aria-label="Cancel editing"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveBanner} className="banner-editor-form">
                  <div className="editor-form-grid">
                    {/* Left Column: Form Fields */}
                    <div className="editor-fields-col">
                      <div className="admin-field-group">
                        <label htmlFor="bannerTitle">Campaign / Reference Name *</label>
                        <input
                          id="bannerTitle"
                          type="text"
                          required
                          placeholder="e.g. 18K Gold Plated Anti-Tarnish Collection"
                          value={bannerForm.title}
                          onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                        />
                        <span className="field-hint">Used for administrative tracking and accessibility image alt tag.</span>
                      </div>

                      {/* Redirect Target URL */}
                      <div className="admin-field-group">
                        <label htmlFor="bannerRedirect">Target Redirect URL (Where clicking takes the user) *</label>
                        <input
                          id="bannerRedirect"
                          type="text"
                          required
                          placeholder="e.g. /anti-tarnish-jewellery or /sale or /products/101"
                          value={bannerForm.redirectUrl}
                          onChange={(e) => setBannerForm({ ...bannerForm, redirectUrl: e.target.value })}
                        />

                        {/* Quick destination chips */}
                        <div className="redirect-presets-strip">
                          <span className="preset-strip-label">Quick destinations:</span>
                          <div className="preset-chips-wrap">
                            {QUICK_REDIRECT_OPTIONS.map((opt) => (
                              <button
                                key={opt.url}
                                type="button"
                                className={`preset-chip-btn ${bannerForm.redirectUrl === opt.url ? 'is-selected' : ''}`}
                                onClick={() => setBannerForm({ ...bannerForm, redirectUrl: opt.url })}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Image URL Input */}
                      <div className="admin-field-group">
                        <CloudinaryUploadButton
                          label="Campaign Banner Artwork (Cloudinary Upload)"
                          value={bannerForm.imageUrl}
                          onChange={(url) => setBannerForm({ ...bannerForm, imageUrl: url })}
                          folder="satvastones/banners"
                        />

                        {/* Preset Jewellery Photography Options */}
                        <div className="preset-images-picker">
                          <span className="preset-strip-label">Or select high-resolution jewellery photography preset:</span>
                          <div className="preset-thumbs-grid">
                            {PRESET_BANNER_IMAGES.map((preset) => (
                              <button
                                key={preset.url}
                                type="button"
                                className={`preset-thumb-tile ${bannerForm.imageUrl === preset.url ? 'is-selected' : ''}`}
                                onClick={() => setBannerForm({ ...bannerForm, imageUrl: preset.url })}
                                title={preset.label}
                              >
                                <div
                                  className="thumb-tile-img"
                                  style={{ backgroundImage: `url(${preset.url})` }}
                                />
                                <span className="thumb-tile-label">{preset.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Toggles */}
                      <div className="editor-checkbox-row">
                        <label className="admin-checkbox-label">
                          <input
                            type="checkbox"
                            checked={bannerForm.active}
                            onChange={(e) => setBannerForm({ ...bannerForm, active: e.target.checked })}
                          />
                          <span>Active in Storefront Hero Slider</span>
                        </label>
                      </div>

                      <div className="editor-actions-strip">
                        <button type="submit" className="btn btn-primary">
                          Save Banner to Storefront
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setIsEditingBanner(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Live Thumbnail & Redirect Preview */}
                    <div className="editor-preview-col">
                      <span className="preview-heading">Pure Image Banner Preview (Zero Overlaid Text)</span>
                      <div className="live-banner-preview-card">
                        <div
                          className="preview-viewport"
                          style={{ backgroundImage: `url(${bannerForm.imageUrl})` }}
                        />
                        <div className="preview-redirect-indicator">
                          <span>Clicking this image will open:</span>
                          <strong>{bannerForm.redirectUrl}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Configured Banners List */}
            <div className="banners-management-grid">
              {displayedBanners.map((banner, index) => (
                <div
                  key={banner.id}
                  className={`banner-control-card ${!banner.active ? 'is-inactive' : ''}`}
                >
                  {/* Thumbnail */}
                  <div className="banner-card-media">
                    <div
                      className="banner-card-image"
                      style={{ backgroundImage: `url(${banner.imageUrl})` }}
                    >
                      <span className={`banner-status-tag ${banner.active ? 'is-active' : 'is-disabled'}`}>
                        {banner.active ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  {/* Banner Metadata & Links */}
                  <div className="banner-card-body">
                    <div className="banner-title-line">
                      <h4 className="banner-card-title">{banner.title || `Promotional Slide #${index + 1}`}</h4>
                    </div>

                    <div className="banner-redirect-badge">
                      <ExternalLink size={13} className="redirect-icon" />
                      <span>Redirects to:</span>
                      <Link href={banner.redirectUrl} target="_blank" className="redirect-link-text">
                        {banner.redirectUrl}
                      </Link>
                    </div>

                    {/* Action Bar */}
                    <div className="banner-card-actions">
                      <div className="reorder-buttons-group">
                        <button
                          type="button"
                          className="action-icon-btn"
                          disabled={index === 0}
                          onClick={() => moveBanner(index, 'up')}
                          title="Move banner earlier in slider"
                          aria-label="Move up"
                        >
                          <ArrowUp size={15} />
                        </button>
                        <button
                          type="button"
                          className="action-icon-btn"
                          disabled={index === promoBanners.length - 1}
                          onClick={() => moveBanner(index, 'down')}
                          title="Move banner later in slider"
                          aria-label="Move down"
                        >
                          <ArrowDown size={15} />
                        </button>
                      </div>

                      <div className="control-buttons-group">
                        <button
                          type="button"
                          className={`btn btn-sm ${banner.active ? 'btn-secondary' : 'btn-outline'}`}
                          onClick={() => toggleBannerActive(banner.id)}
                          title={banner.active ? "Disable banner from storefront" : "Enable banner on storefront"}
                        >
                          {banner.active ? <EyeOff size={14} /> : <Eye size={14} />}
                          <span>{banner.active ? 'Hide' : 'Enable'}</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEditBanner(banner)}
                          title="Edit image and destination link"
                        >
                          <Edit3 size={14} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          className="action-icon-btn delete-btn"
                          disabled={displayedBanners.length <= 1}
                          onClick={() => handleDeleteBanner(banner.id)}
                          title="Delete this banner"
                          aria-label="Delete banner"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB: HOMEPAGE CATEGORY TILES & NAVIGATION */}
        {activeTab === 'categories' && (
          <section className="admin-card-section">
            <div className="admin-card-header">
              <div>
                <h2 className="admin-card-title">Homepage &apos;Shop by category&apos; &amp; Navigation Tiles</h2>
                <p className="admin-card-subtitle">
                  Manage the circular photography tiles featured on the homepage. Upload real jewelry photos to Cloudinary, edit names, subheadings, and link destinations.
                </p>
              </div>

              <div className="admin-header-actions-row">
                <button
                  type="button"
                  className="btn btn-primary admin-btn-sm"
                  onClick={handleOpenNewCategory}
                >
                  <Plus size={15} style={{ marginRight: 6 }} /> Add Category Tile
                </button>
                <button
                  type="button"
                  className="btn btn-secondary admin-btn-sm"
                  onClick={reloadCategories}
                  title="Reload categories from MongoDB Atlas"
                >
                  <RefreshCw size={14} style={{ marginRight: 6 }} /> Refresh Atlas
                </button>
              </div>
            </div>

            {/* Live Storefront Preview Box */}
            <div className="category-live-preview-box">
              <div className="category-preview-header">
                <h4>
                  <Eye size={16} className="text-gold" />
                  <span>Live Storefront Preview (&apos;Shop by category&apos; Row)</span>
                </h4>
                <span className="text-xs text-muted">
                  Showing {categoriesList.filter((c) => c.isFeatured !== false).length} featured categories appearing on the homepage
                </span>
              </div>

              <div className="category-preview-strip">
                {categoriesList
                  .filter((c) => c.isFeatured !== false)
                  .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                  .map((cat, idx) => {
                    const imgSrc = cat.imageUrl || cat.image;
                    return (
                      <div key={cat.id || cat._id || idx} className="category-preview-tile">
                        <div className="category-preview-circle">
                          {imgSrc ? (
                            <Image
                              src={imgSrc}
                              alt={cat.name}
                              fill
                              sizes="60px"
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <span style={{ fontFamily: 'var(--font-editorial)', fontSize: '1.2rem', fontWeight: 500 }}>
                              {cat.name?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <span className="category-preview-tile-title">{cat.name}</span>
                        <span className="category-preview-tile-desc">{cat.description || cat.count}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Category Editor Drawer */}
            {isEditingCategory && (
              <div className="banner-editor-card">
                <div className="editor-card-header">
                  <h3>{categoryForm.id ? `Edit Category: ${categoryForm.name}` : 'Create New Category Tile'}</h3>
                  <button
                    type="button"
                    className="editor-close-btn"
                    onClick={() => setIsEditingCategory(false)}
                    aria-label="Cancel editing"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveCategory} className="banner-editor-form">
                  <div className="editor-form-grid">
                    {/* Left Column: Form Fields */}
                    <div className="editor-fields-col">
                      <div className="form-row two-cols">
                        <div className="admin-field-group">
                          <label htmlFor="catName">Category Title *</label>
                          <input
                            id="catName"
                            type="text"
                            required
                            placeholder="e.g. Anti-Tarnish Chains"
                            value={categoryForm.name}
                            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                          />
                        </div>

                        <div className="admin-field-group">
                          <label htmlFor="catDesc">Tagline / Subheading *</label>
                          <input
                            id="catDesc"
                            type="text"
                            placeholder="e.g. Waterproof steel or Freshwater pearls"
                            value={categoryForm.description}
                            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="admin-field-group">
                        <label htmlFor="catHref">Destination Page URL (Where clicking takes the visitor) *</label>
                        <input
                          id="catHref"
                          type="text"
                          required
                          placeholder="e.g. /anti-tarnish-jewellery or /korean-jewellery"
                          value={categoryForm.href}
                          onChange={(e) => setCategoryForm({ ...categoryForm, href: e.target.value })}
                        />

                        {/* Quick Destination Chips */}
                        <div className="redirect-presets-strip">
                          <span className="preset-strip-label">Quick destinations:</span>
                          <div className="preset-chips-wrap">
                            {QUICK_REDIRECT_OPTIONS.map((opt) => (
                              <button
                                key={opt.url}
                                type="button"
                                className={`preset-chip-btn ${categoryForm.href === opt.url ? 'is-selected' : ''}`}
                                onClick={() => setCategoryForm({ ...categoryForm, href: opt.url })}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Cloudinary Upload Button */}
                      <div className="admin-field-group">
                        <CloudinaryUploadButton
                          label="Category Photography (Direct Cloudinary Upload)"
                          value={categoryForm.imageUrl}
                          onChange={(url) => setCategoryForm({ ...categoryForm, imageUrl: url })}
                          folder="satvastones/categories"
                        />
                      </div>

                      {/* Quick Preset Images */}
                      <div className="admin-field-group">
                        <label>Or select from verified jewellery presets:</label>
                        <div className="preset-thumbnails-grid">
                          {PRESET_CATEGORY_IMAGES.map((preset) => (
                            <button
                              key={preset.url}
                              type="button"
                              className={`preset-thumb-tile ${categoryForm.imageUrl === preset.url ? 'is-selected' : ''}`}
                              onClick={() => setCategoryForm({ ...categoryForm, imageUrl: preset.url })}
                            >
                              <div className="preset-thumb-img-wrap" style={{ borderRadius: '50%' }}>
                                <Image
                                  src={preset.url}
                                  alt={preset.label}
                                  width={48}
                                  height={48}
                                  style={{ objectFit: 'cover', borderRadius: '50%' }}
                                  unoptimized
                                />
                              </div>
                              <span className="preset-thumb-label">{preset.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-row two-cols">
                        <div className="admin-field-group">
                          <label htmlFor="catSort">Sort Order (0 = First)</label>
                          <input
                            id="catSort"
                            type="number"
                            value={categoryForm.sortOrder}
                            onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: Number(e.target.value) })}
                          />
                        </div>

                        <div className="admin-field-group checkbox-field">
                          <label className="checkbox-label" style={{ marginTop: '26px' }}>
                            <input
                              type="checkbox"
                              checked={categoryForm.isFeatured}
                              onChange={(e) => setCategoryForm({ ...categoryForm, isFeatured: e.target.checked })}
                            />
                            <span>Featured on Homepage (&apos;Shop by category&apos; row)</span>
                          </label>
                        </div>
                      </div>

                      <div className="editor-form-actions">
                        <button type="submit" className="btn btn-primary">
                          <CheckCircle2 size={15} style={{ marginRight: 6 }} />
                          {categoryForm.id ? 'Save Category Changes' : 'Create Category Tile'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setIsEditingCategory(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Live Circular Tile Preview */}
                    <div className="editor-preview-col">
                      <span className="preview-col-label">Storefront Circular Tile Preview:</span>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: '32px 20px',
                          background: 'var(--surface)',
                          border: '1px solid var(--line)',
                          borderRadius: 'var(--radius-xs)',
                          textAlign: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            position: 'relative',
                            overflow: 'hidden',
                            border: '1.5px solid var(--line)',
                            background: 'var(--canvas-subtle)',
                            marginBottom: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          }}
                        >
                          {categoryForm.imageUrl ? (
                            <Image
                              src={categoryForm.imageUrl}
                              alt={categoryForm.name || 'Category'}
                              fill
                              sizes="80px"
                              style={{ objectFit: 'cover' }}
                              unoptimized
                            />
                          ) : (
                            <span
                              style={{
                                display: 'flex',
                                width: '100%',
                                height: '100%',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontFamily: 'var(--font-editorial)',
                                fontSize: '1.6rem',
                              }}
                            >
                              {categoryForm.name?.charAt(0) || 'C'}
                            </span>
                          )}
                        </div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '0.92rem', fontWeight: 600 }}>
                          {categoryForm.name || 'Category Title'}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ink-tertiary)' }}>
                          {categoryForm.description || 'Category Tagline'}
                        </span>
                        <span className="category-link-pill" style={{ marginTop: '12px' }}>
                          Target: {categoryForm.href || '/anti-tarnish-jewellery'}
                        </span>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Categories Table */}
            <div className="category-admin-table-wrap">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th style={{ width: 64 }}>Visual</th>
                    <th>Category Title</th>
                    <th>Tagline / Subtitle</th>
                    <th>Destination Page</th>
                    <th style={{ width: 140 }}>Homepage Status</th>
                    <th style={{ width: 90 }}>Order</th>
                    <th style={{ width: 140, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categoriesList.map((cat, idx) => {
                    const imgSrc = cat.imageUrl || cat.image;
                    const isFeatured = cat.isFeatured !== false;

                    return (
                      <tr key={cat.id || cat._id || idx}>
                        <td>
                          <div className="category-row-circle">
                            {imgSrc ? (
                              <Image
                                src={imgSrc}
                                alt={cat.name}
                                fill
                                sizes="48px"
                                style={{ objectFit: 'cover' }}
                                unoptimized
                              />
                            ) : (
                              <span style={{ fontFamily: 'var(--font-editorial)', fontSize: '1rem', fontWeight: 600 }}>
                                {cat.name?.charAt(0)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <strong>{cat.name}</strong>
                          <span className="sku-sub-code">{cat.slug}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)' }}>
                            {cat.description || cat.count || '—'}
                          </span>
                        </td>
                        <td>
                          <span className="category-link-pill">
                            {cat.href || `/${cat.slug}`}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleToggleCategoryFeatured(cat)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            title="Click to toggle homepage display"
                          >
                            {isFeatured ? (
                              <span className="category-badge-featured">
                                <Check size={11} /> Featured
                              </span>
                            ) : (
                              <span className="category-badge-catalog">Catalog Only</span>
                            )}
                          </button>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                            #{cat.sortOrder ?? idx}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="row-action-buttons" style={{ justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleOpenEditCategory(cat)}
                              title="Edit image and details"
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                            <button
                              type="button"
                              className="action-icon-btn delete-btn"
                              onClick={() => handleDeleteCategory(cat)}
                              title="Delete category"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 2: VOUCHERS & PRIVILEGES ENGINE */}
        {activeTab === 'vouchers' && (
          <section className="admin-card-section">
            <div className="admin-card-header">
              <div>
                <h2 className="admin-card-title">Vouchers & Privilege Codes Engine</h2>
                <p className="admin-card-subtitle">
                  Configure discount codes. Any modifications instantly update the Customer Account page, Mini-Bag Drawer, Cart, and Checkout flows.
                </p>
              </div>

              <div className="admin-header-actions-row">
                <button
                  type="button"
                  className="btn btn-primary admin-btn-sm"
                  onClick={() => setIsAddingVoucher(true)}
                >
                  <Plus size={15} style={{ marginRight: 6 }} /> Create Voucher Code
                </button>
                <button
                  type="button"
                  className="btn btn-secondary admin-btn-sm"
                  onClick={resetVouchersToDefault}
                  title="Restore default vouchers"
                >
                  <RefreshCw size={14} style={{ marginRight: 6 }} /> Reset Defaults
                </button>
              </div>
            </div>

            {/* Voucher Creation Drawer */}
            {isAddingVoucher && (
              <div className="banner-editor-card">
                <div className="editor-card-header">
                  <h3>Create New Privilege Voucher</h3>
                  <button
                    type="button"
                    className="editor-close-btn"
                    onClick={() => setIsAddingVoucher(false)}
                    aria-label="Cancel"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveVoucher} className="voucher-create-form">
                  <div className="form-row three-cols">
                    <div className="admin-field-group">
                      <label>Voucher Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. FESTIVE20"
                        value={voucherForm.code}
                        onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
                      />
                    </div>

                    <div className="admin-field-group">
                      <label>Discount Type *</label>
                      <select
                        value={voucherForm.type}
                        onChange={(e) => setVoucherForm({ ...voucherForm, type: e.target.value })}
                        className="admin-select"
                      >
                        <option value="fixed">Flat Amount (₹ Off)</option>
                        <option value="percent">Percentage (% Off)</option>
                      </select>
                    </div>

                    <div className="admin-field-group">
                      <label>Discount Value *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 200 or 15"
                        value={voucherForm.value}
                        onChange={(e) => setVoucherForm({ ...voucherForm, value: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row three-cols">
                    <div className="admin-field-group">
                      <label>Minimum Cart Value (₹)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 499 (0 for none)"
                        value={voucherForm.minOrder}
                        onChange={(e) => setVoucherForm({ ...voucherForm, minOrder: e.target.value })}
                      />
                    </div>

                    <div className="admin-field-group">
                      <label>Minimum Items Required</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 2 for pair discount"
                        value={voucherForm.minItems}
                        onChange={(e) => setVoucherForm({ ...voucherForm, minItems: e.target.value })}
                      />
                    </div>

                    <div className="admin-field-group">
                      <label>Validity / Expiry Label</label>
                      <input
                        type="text"
                        placeholder="e.g. 31 Dec 2026"
                        value={voucherForm.expiry}
                        onChange={(e) => setVoucherForm({ ...voucherForm, expiry: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="admin-field-group">
                    <label>Client Facing Description *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ₹200 off on your next order above ₹499"
                      value={voucherForm.description}
                      onChange={(e) => setVoucherForm({ ...voucherForm, description: e.target.value })}
                    />
                  </div>

                  <div className="editor-actions-strip">
                    <button type="submit" className="btn btn-primary">
                      Deploy Voucher to Storefront
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setIsAddingVoucher(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Vouchers Table */}
            <div className="orders-table-wrapper">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Voucher Code</th>
                    <th>Discount</th>
                    <th>Conditions</th>
                    <th>Description</th>
                    <th>Validity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((v) => (
                    <tr key={v.code}>
                      <td>
                        <span className="voucher-code-badge">{v.code}</span>
                      </td>
                      <td>
                        <strong>{v.type === 'fixed' ? `₹${v.value} Off` : `${v.value}% Off`}</strong>
                      </td>
                      <td>
                        <span className="condition-pill">
                          {v.minOrder > 0 ? `Min. ₹${v.minOrder}` : 'No Min.'}
                          {v.minItems > 0 ? ` • ${v.minItems}+ Pcs` : ''}
                        </span>
                      </td>
                      <td className="desc-cell">{v.description}</td>
                      <td>{v.expiry || 'Active'}</td>
                      <td>
                        <span className={`status-badge-cell ${v.active !== false ? 'is-active-tag' : 'is-inactive-tag'}`}>
                          {v.active !== false ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td>
                        <div className="row-action-buttons">
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => toggleVoucherActive(v.code)}
                          >
                            {v.active !== false ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            type="button"
                            className="action-icon-btn delete-btn"
                            onClick={() => deleteVoucher(v.code)}
                            title="Delete voucher"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 3: CUSTOMER DIRECTORY & DATABASE RECORDS */}
        {activeTab === 'customers' && (
          <section className="admin-card-section">
            <div className="admin-card-header">
              <div>
                <h2 className="admin-card-title">Registered & Order Customer Directory</h2>
                <p className="admin-card-subtitle">
                  Live synchronized directory of clients from MongoDB Atlas orders and authenticated users. View full customer profile, saved addresses, contact numbers, and order history.
                </p>
              </div>

              <div className="admin-header-controls-row">
                <div className="admin-search-box">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, email, city, address..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="admin-search-input"
                  />
                  {customerSearch && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => setCustomerSearch('')}
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={fetchCustomers}
                  className="btn btn-secondary admin-btn-sm"
                  title="Refresh customers from database"
                >
                  <RefreshCw size={13} className={customersLoading ? 'spin-icon' : ''} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            <div className="orders-table-wrapper">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Customer Profile</th>
                    <th>Contact Info</th>
                    <th>Detailed Shipping Address</th>
                    <th>Orders Placed</th>
                    <th>Lifetime Value</th>
                    <th>Tier & Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-table-state">
                        <Users size={32} />
                        <p>No customer profiles found matching &ldquo;{customerSearch}&rdquo;</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust) => {
                      const defaultAddr = cust.defaultAddress || cust.addresses?.[0];
                      const cleanPhone = (cust.phone || '').replace(/[^0-9]/g, '');
                      const isCopied = copiedKey === `cust-addr-${cust.id}`;

                      return (
                        <tr key={cust.id} className="customer-table-row">
                          <td>
                            <div className="customer-avatar-lockup">
                              <div className="customer-avatar-circle">
                                {cust.name ? cust.name.slice(0, 2).toUpperCase() : 'CU'}
                              </div>
                              <div>
                                <strong className="customer-primary-name">{cust.name}</strong>
                                <span className="customer-joined-date">Joined {cust.joinedDate || 'Recently'}</span>
                                <span className="google-auth-badge">
                                  {cust.authProvider?.includes('Google') ? (
                                    <>
                                      <span className="google-dot">G</span> Google Verified
                                    </>
                                  ) : (
                                    <span className="order-verified-dot">✓ Store Client</span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div className="customer-contact-cell">
                              {cust.phone ? (
                                <div className="contact-item">
                                  <a href={`tel:${cust.phone}`} className="phone-link">
                                    <Phone size={12} /> {cust.phone}
                                  </a>
                                  {cleanPhone && (
                                    <a
                                      href={`https://wa.me/91${cleanPhone.slice(-10)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="whatsapp-pill-link"
                                      title="WhatsApp this customer"
                                    >
                                      <MessageSquare size={11} />
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <span className="contact-missing">No phone</span>
                              )}
                              {cust.email ? (
                                <a href={`mailto:${cust.email}`} className="email-link">
                                  <Mail size={12} /> {cust.email}
                                </a>
                              ) : (
                                <span className="contact-missing">No email</span>
                              )}
                            </div>
                          </td>

                          <td className="address-snippet-cell">
                            {defaultAddr ? (
                              <div className="address-full-view">
                                <span className="address-line-text">{defaultAddr.address || defaultAddr.formatted}</span>
                                {(defaultAddr.city || defaultAddr.pincode) && (
                                  <span className="address-city-pincode">
                                    {defaultAddr.city} {defaultAddr.state ? `, ${defaultAddr.state}` : ''} {defaultAddr.pincode ? `- ${defaultAddr.pincode}` : ''}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  className={`copy-address-btn ${isCopied ? 'is-copied' : ''}`}
                                  onClick={() =>
                                    handleCopy(
                                      defaultAddr.formatted ||
                                        `${cust.name}\n${defaultAddr.address}\n${defaultAddr.city} ${defaultAddr.pincode}\nPhone: ${cust.phone}`,
                                      `cust-addr-${cust.id}`
                                    )
                                  }
                                >
                                  {isCopied ? <Check size={11} /> : <Copy size={11} />}
                                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>
                            ) : (
                              <span className="no-address">No saved address yet</span>
                            )}
                          </td>

                          <td className="orders-count-cell">
                            <span className="orders-counter-chip">
                              <ShoppingBag size={13} /> {cust.ordersCount || 0}
                            </span>
                          </td>

                          <td className="value-cell">
                            <strong>₹{cust.totalSpend || 0}</strong>
                          </td>

                          <td>
                            <span className={`client-tier-chip tier-${(cust.status || 'Active').toLowerCase().replace(/\s+/g, '-')}`}>
                              {cust.status || 'Active Member'}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="view-details-action-btn"
                              onClick={() => setSelectedCustomerProfile(cust)}
                            >
                              <Eye size={13} />
                              <span>View Profile</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 4: AUTOMATED SEO & SCHEMA CONTROL CENTER */}
        {activeTab === 'seo' && (
          <section className="admin-card-section">
            <div className="admin-card-header">
              <div>
                <h2 className="admin-card-title">Automated Dynamic SEO & Schema Engine</h2>
                <p className="admin-card-subtitle">
                  Zero manual updates needed. Google SERP JSON-LD structured data, canonical tags, and OpenGraph metadata are continuously generated from your catalog.
                </p>
              </div>

              <div className="seo-status-chip">
                <CheckCircle2 size={16} className="text-forest" />
                <span>100% Automated & In Sync</span>
              </div>
            </div>

            {/* Live Google Search Preview Simulator */}
            <div className="seo-serp-simulator-card">
              <span className="simulator-label">Google Rich Snippet Live Simulator (Organic SERP)</span>
              <div className="google-serp-preview">
                <div className="serp-breadcrumbs">
                  <span className="serp-favicon">S</span>
                  <span className="serp-domain">https://satvastones.com</span>
                  <span className="serp-arrow">›</span>
                  <span className="serp-slug">anti-tarnish-jewellery</span>
                </div>
                <h3 className="serp-title">
                  18K Gold Plated Anti-Tarnish Jewellery | Satvastones Demi-Fine Luxury
                </h3>
                <div className="serp-rating-line">
                  <span className="serp-stars">★★★★★</span>
                  <span className="serp-rating-score">4.9</span>
                  <span className="serp-reviews-count">(184 reviews)</span>
                  <span className="serp-price-point">· ₹499 to ₹1,499</span>
                  <span className="serp-stock-tag">· In stock</span>
                </div>
                <p className="serp-snippet">
                  Buy 18K real gold vacuum PVD anti-tarnish jewellery engineered over medical-grade 316L surgical steel. 100% waterproof, sweatproof, and hypoallergenic. Free express shipping above ₹499 &amp; Cash on delivery nationwide.
                </p>
              </div>
            </div>

            {/* SEO Automation Highlights Grid */}
            <div className="seo-engine-grid">
              <div className="seo-feature-tile">
                <div className="feature-tile-icon">
                  <ShieldCheck size={20} />
                </div>
                <h4>Automated Product Schema (JSON-LD)</h4>
                <p>
                  Every Product Detail Page (`/products/[id]`) injects full schema.org/Product data with real-time price, INR currency, availability, and aggregate reviews.
                </p>
                <div className="schema-code-preview">
                  <code>{`"@type": "Product", "offers": { "price": "499", "availability": "InStock" }`}</code>
                </div>
              </div>

              <div className="seo-feature-tile">
                <div className="feature-tile-icon">
                  <Globe size={20} />
                </div>
                <h4>Collection ItemList Schema</h4>
                <p>
                  Collections (`/anti-tarnish-jewellery`, `/korean-jewellery`, `/indian-jewellery`) emit ItemList schemas for multi-product Google carousels.
                </p>
                <div className="schema-code-preview">
                  <code>{`"@type": "ItemList", "numberOfItems": 24, "itemListElement": [...]`}</code>
                </div>
              </div>

              <div className="seo-feature-tile">
                <div className="feature-tile-icon">
                  <SlidersHorizontal size={20} />
                </div>
                <h4>BreadcrumbList Schema</h4>
                <p>
                  Automated 3-tier breadcrumbs across all catalog routes (Home &gt; Category &gt; Product) allowing Google to render rich URL breadcrumbs in search results.
                </p>
                <div className="schema-code-preview">
                  <code>{`"@type": "BreadcrumbList", "itemListElement": [Home, Collection, Piece]`}</code>
                </div>
              </div>

              <div className="seo-feature-tile">
                <div className="feature-tile-icon">
                  <CheckCircle2 size={20} />
                </div>
                <h4>Interactive FAQPage Schema</h4>
                <p>
                  High-intent Question &amp; Answer pairs across `/anti-tarnish-jewellery`, `/waterproof-jewellery`, `/korean-jewellery`, and `/indian-jewellery` inject schema.org/FAQPage for Google expandable SERP snippets.
                </p>
                <div className="schema-code-preview">
                  <code>{`"@type": "FAQPage", "mainEntity": [{ "name": "...", "acceptedAnswer": "..." }]`}</code>
                </div>
              </div>

              <div className="seo-feature-tile">
                <div className="feature-tile-icon">
                  <Globe size={20} />
                </div>
                <h4>Editorial Article &amp; Blog Schema</h4>
                <p>
                  Guides and journals (`/journal`, `/jewellery-care`) emit schema.org/Article structured data answering long-tail search queries on gold plating vs vacuum PVD.
                </p>
                <div className="schema-code-preview">
                  <code>{`"@type": "Article", "headline": "...", "author": "Satvastones Atelier"}`}</code>
                </div>
              </div>

              <div className="seo-feature-tile">
                <div className="feature-tile-icon">
                  <CheckCircle2 size={20} />
                </div>
                <h4>Automatic Canonical &amp; OpenGraph</h4>
                <p>
                  Configured with canonical root `https://satvastones.com`, high-resolution preview graphics, and script logo metadata.
                </p>
                <div className="schema-code-preview">
                  <code>{`<link rel="canonical" href="https://satvastones.com/..." />`}</code>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 5: ORDER DISPATCH QUEUE */}
        {activeTab === 'dispatch' && (
          <section className="admin-card-section">
            <div className="admin-card-header">
              <div>
                <h2 className="admin-card-title">Order Dispatch & Customer Fulfillment Queue</h2>
                <p className="admin-card-subtitle">
                  Inspect complete customer contact and shipping addresses, verify jewelry items, update courier tracking, and advance fulfillment steps.
                </p>
              </div>

              <div className="admin-header-controls-row">
                <div className="admin-filter-bar">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="admin-select"
                    aria-label="Filter orders by status"
                  >
                    <option value="all">All statuses ({orders.length})</option>
                    <option value="pending">Pending dispatch</option>
                    <option value="courier">Ready for courier</option>
                    <option value="transit">In transit</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={fetchOrders}
                  className="btn btn-secondary admin-btn-sm"
                  title="Refresh orders from database"
                >
                  <RefreshCw size={13} />
                  <span>Refresh Orders</span>
                </button>
              </div>
            </div>

            <div className="orders-table-wrapper">
              <table className="admin-data-table orders-rich-table">
                <thead>
                  <tr>
                    <th>Order &amp; Time</th>
                    <th>Customer &amp; Contact</th>
                    <th>Full Shipping Address</th>
                    <th>Items &amp; Variants</th>
                    <th>Amount &amp; Payment</th>
                    <th>Status</th>
                    <th>Actions &amp; Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-table-state">
                        <PackageCheck size={32} />
                        <p>No orders currently match the selected status filter &ldquo;{filterStatus}&rdquo;.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => {
                      const cleanPhone = (ord.phone || '').replace(/[^0-9]/g, '');
                      const waText = encodeURIComponent(
                        `Hello ${ord.client}, thank you for choosing SatvaStones Atelier! Your order #${ord.id} is being processed.`
                      );
                      const isCopied = copiedKey === `addr-${ord.id}`;

                      return (
                        <tr key={ord.id} className="order-table-row">
                          {/* 1. Order & Time */}
                          <td>
                            <div className="order-ref-cell">
                              <span className="order-id-badge">{ord.id}</span>
                              <span className="order-time-sub">{ord.created}</span>
                              {ord.trackingId && (
                                <span className="tracking-sub-pill" title={`Tracking: ${ord.trackingId}`}>
                                  📦 {ord.trackingId}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 2. Customer & Contact */}
                          <td>
                            <div className="customer-info-cell">
                              <strong className="customer-primary-name">{ord.client}</strong>
                              {ord.phone ? (
                                <div className="customer-contact-links">
                                  <a href={`tel:${ord.phone}`} className="customer-contact-link phone-link" title="Call Customer">
                                    <Phone size={12} />
                                    <span>{ord.phone}</span>
                                  </a>
                                  {cleanPhone && (
                                    <a
                                      href={`https://wa.me/91${cleanPhone.slice(-10)}?text=${waText}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="customer-contact-link whatsapp-link"
                                      title="Message customer on WhatsApp"
                                    >
                                      <MessageSquare size={12} />
                                      <span>WhatsApp</span>
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <span className="contact-missing">No phone provided</span>
                              )}
                              {ord.email && (
                                <a href={`mailto:${ord.email}`} className="customer-email-sub" title="Send Email">
                                  <Mail size={11} />
                                  <span>{ord.email}</span>
                                </a>
                              )}
                            </div>
                          </td>

                          {/* 3. Full Shipping Address */}
                          <td className="address-column-cell">
                            <div className="address-info-block">
                              <p className="address-street-line">{ord.address || 'Address on record'}</p>
                              <span className="address-city-state">
                                {ord.city}
                                {ord.state ? `, ${ord.state}` : ''}
                                {ord.pincode ? ` - ${ord.pincode}` : ''}
                              </span>
                              <button
                                type="button"
                                className={`copy-address-btn ${isCopied ? 'is-copied' : ''}`}
                                onClick={() =>
                                  handleCopy(
                                    `${ord.client}\n${ord.address}\n${ord.city}${ord.state ? ', ' + ord.state : ''} - ${ord.pincode}\nPhone: ${ord.phone}`,
                                    `addr-${ord.id}`
                                  )
                                }
                                title="Copy complete delivery address for courier"
                              >
                                {isCopied ? (
                                  <>
                                    <Check size={12} /> Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} /> Copy Address
                                  </>
                                )}
                              </button>
                            </div>
                          </td>

                          {/* 4. Items Ordered */}
                          <td className="items-cell">
                            <div className="items-summary-wrap">
                              <span className="items-count-chip">
                                <ShoppingBag size={12} /> {ord.itemsList?.length || 1} piece{(ord.itemsList?.length || 1) > 1 ? 's' : ''}
                              </span>
                              <p className="items-title-string">{ord.items}</p>
                            </div>
                          </td>

                          {/* 5. Amount & Settlement */}
                          <td>
                            <div className="settlement-cell-wrap">
                              <span className="value-number">₹{ord.value}</span>
                              <span className={`payment-pill ${ord.payment?.includes('COD') ? 'is-cod' : 'is-upi'}`}>
                                {ord.payment?.includes('COD') ? 'COD' : 'Paid Online'}
                              </span>
                              {ord.discountAmount > 0 && (
                                <span className="discount-tag-sub">
                                  Saved ₹{ord.discountAmount} {ord.couponCode && `(${ord.couponCode})`}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 6. Status */}
                          <td>
                            <span className={`status-badge-cell status-${(ord.status || 'Confirmed').toLowerCase().replace(/\s+/g, '-')}`}>
                              {ord.status}
                            </span>
                          </td>

                          {/* 7. Action & View Details */}
                          <td>
                            <div className="order-actions-cell">
                              <button
                                type="button"
                                className="view-details-action-btn"
                                onClick={() => setSelectedOrderDetails(ord)}
                                title="View full customer and order details"
                              >
                                <Eye size={13} />
                                <span>View Full Info</span>
                              </button>
                              {ord.status !== 'Delivered' && (
                                <button
                                  type="button"
                                  className="advance-action-btn"
                                  onClick={() => advanceStatus(ord.id)}
                                >
                                  Advance Step →
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 6: INVENTORY MONITORS */}
        {activeTab === 'inventory' && (
          <section className="admin-card-section">
            <div className="admin-card-header">
              <div>
                <h2 className="admin-card-title">Inventory & Anti-Tarnish Stock Levels</h2>
                <p className="admin-card-subtitle">Monitor pieces approaching safe reorder limits</p>
              </div>
            </div>

            <div className="inventory-grid-list">
              {inventoryAlerts.map((inv) => (
                <div key={inv.id} className="inventory-card-item">
                  <div className="inv-header">
                    <span className="inv-category">{inv.category}</span>
                    <span className={`inv-status-pill ${inv.status.includes('Critical') ? 'is-critical' : ''}`}>
                      {inv.status}
                    </span>
                  </div>
                  <h4 className="inv-title">{inv.title}</h4>
                  <div className="inv-footer">
                    <span className="inv-stock-count">
                      Units available: <strong>{inv.stock}</strong>
                    </span>
                    <button type="button" className="inv-restock-btn">
                      + Restock Batch
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ORDER & CUSTOMER FULL DETAILS MODAL */}
      {selectedOrderDetails && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrderDetails(null)}>
          <div className="admin-modal-container order-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="modal-title-lockup">
                <span className="modal-kicker">Order &amp; Customer Full Dossier</span>
                <h3 className="admin-modal-title">Order #{selectedOrderDetails.id}</h3>
                <span className="order-modal-timestamp">Placed on {selectedOrderDetails.created}</span>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedOrderDetails(null)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="order-details-modal-body">
              {/* TOP CARDS: Customer Details & Dispatch Information */}
              <div className="order-modal-cards-grid">
                {/* Card 1: Customer Contact & Profile */}
                <div className="order-detail-card customer-card">
                  <div className="card-heading-bar">
                    <Users size={16} />
                    <h4>Customer Contact &amp; Profile</h4>
                  </div>
                  <div className="customer-dossier-list">
                    <div className="dossier-row">
                      <span className="dossier-label">Full Name:</span>
                      <strong className="dossier-value highlight">{selectedOrderDetails.client}</strong>
                    </div>

                    <div className="dossier-row">
                      <span className="dossier-label">Phone Number:</span>
                      <div className="dossier-value contact-actions-value">
                        <a href={`tel:${selectedOrderDetails.phone}`} className="phone-badge-link">
                          <Phone size={13} /> {selectedOrderDetails.phone || 'Not provided'}
                        </a>
                        {selectedOrderDetails.phone && (
                          <a
                            href={`https://wa.me/91${selectedOrderDetails.phone.replace(/[^0-9]/g, '').slice(-10)}?text=${encodeURIComponent(
                              `Hello ${selectedOrderDetails.client}, your SatvaStones order #${selectedOrderDetails.id} is confirmed.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="whatsapp-badge-link"
                          >
                            <MessageSquare size={13} /> WhatsApp
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="dossier-row">
                      <span className="dossier-label">Email Address:</span>
                      <div className="dossier-value">
                        {selectedOrderDetails.email ? (
                          <a href={`mailto:${selectedOrderDetails.email}`} className="email-badge-link">
                            <Mail size={13} /> {selectedOrderDetails.email}
                          </a>
                        ) : (
                          <span className="contact-missing">No email on file</span>
                        )}
                      </div>
                    </div>

                    <div className="dossier-row">
                      <span className="dossier-label">Payment Mode:</span>
                      <span className={`payment-pill ${selectedOrderDetails.payment?.includes('COD') ? 'is-cod' : 'is-upi'}`}>
                        {selectedOrderDetails.payment} • {selectedOrderDetails.paymentStatus || 'CONFIRMED'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Full Shipping Address & Courier Dispatch */}
                <div className="order-detail-card shipping-card">
                  <div className="card-heading-bar">
                    <MapPin size={16} />
                    <h4>Full Delivery Address &amp; Shipping</h4>
                  </div>
                  <div className="shipping-dossier-body">
                    <div className="full-address-paper-box">
                      <p className="paper-ship-to">SHIP TO:</p>
                      <p className="paper-name"><strong>{selectedOrderDetails.client}</strong></p>
                      <p className="paper-street">{selectedOrderDetails.address || 'Address line on file'}</p>
                      <p className="paper-city-state">
                        {selectedOrderDetails.city}{selectedOrderDetails.state ? `, ${selectedOrderDetails.state}` : ''}
                        {selectedOrderDetails.pincode ? ` - ${selectedOrderDetails.pincode}` : ''}
                      </p>
                      <p className="paper-country">{selectedOrderDetails.country || 'India'}</p>
                      <p className="paper-phone">Phone: {selectedOrderDetails.phone || 'N/A'}</p>
                    </div>

                    <button
                      type="button"
                      className={`btn btn-secondary copy-full-slip-btn ${copiedKey === `slip-${selectedOrderDetails.id}` ? 'is-copied' : ''}`}
                      onClick={() =>
                        handleCopy(
                          `SHIP TO:\n${selectedOrderDetails.client}\n${selectedOrderDetails.address}\n${selectedOrderDetails.city}${selectedOrderDetails.state ? ', ' + selectedOrderDetails.state : ''} - ${selectedOrderDetails.pincode}\nPhone: ${selectedOrderDetails.phone}\nOrder: ${selectedOrderDetails.id}`,
                          `slip-${selectedOrderDetails.id}`
                        )
                      }
                    >
                      {copiedKey === `slip-${selectedOrderDetails.id}` ? (
                        <>
                          <Check size={14} /> Full Courier Slip Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Copy Full Courier Shipping Slip
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION: ORDERED ITEMS BREAKDOWN */}
              <div className="order-modal-items-section">
                <h4 className="modal-section-heading">Ordered Atelier Pieces ({selectedOrderDetails.itemsList?.length || 1})</h4>
                <div className="modal-items-table-wrap">
                  <table className="modal-items-table">
                    <thead>
                      <tr>
                        <th>Piece</th>
                        <th>Variant / Finish</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedOrderDetails.itemsList || []).map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td>
                            <div className="item-piece-title-lockup">
                              {it.image && (
                                <Image
                                  src={it.image}
                                  alt={it.title}
                                  width={40}
                                  height={40}
                                  className="order-item-thumb"
                                />
                              )}
                              <div>
                                <strong>{it.title || 'Demi-Fine Jewellery'}</strong>
                                {it.sku && <span className="item-sku-sub">SKU: {it.sku}</span>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="item-finish-badge">{it.finish || '18K Gold Plated'}</span>
                          </td>
                          <td>{it.quantity || it.qty || 1}</td>
                          <td>₹{it.price || 0}</td>
                          <td><strong>₹{(it.price || 0) * (it.quantity || it.qty || 1)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="order-modal-financials-bar">
                  <div className="financial-item">
                    <span>Subtotal:</span>
                    <strong>₹{selectedOrderDetails.subtotal || selectedOrderDetails.value}</strong>
                  </div>
                  {selectedOrderDetails.discountAmount > 0 && (
                    <div className="financial-item discount">
                      <span>Privilege Discount ({selectedOrderDetails.couponCode || 'Promo'}):</span>
                      <strong>-₹{selectedOrderDetails.discountAmount}</strong>
                    </div>
                  )}
                  <div className="financial-item">
                    <span>Shipping:</span>
                    <strong>{selectedOrderDetails.shippingFee ? `₹${selectedOrderDetails.shippingFee}` : 'Free Express'}</strong>
                  </div>
                  <div className="financial-item grand-total">
                    <span>Final Amount:</span>
                    <strong className="total-gold">₹{selectedOrderDetails.value}</strong>
                  </div>
                </div>
              </div>

              {/* SECTION: FULFILLMENT & TRACKING CONTROLS */}
              <div className="order-modal-dispatch-bar">
                <div className="dispatch-control-left">
                  <label htmlFor="modal-tracking-input">Courier AWB / Tracking ID:</label>
                  <div className="tracking-input-group">
                    <input
                      id="modal-tracking-input"
                      type="text"
                      placeholder="e.g. BD-89240182-IN"
                      value={
                        editingTrackingOrderId === selectedOrderDetails.id
                          ? trackingInputVal
                          : selectedOrderDetails.trackingId || ''
                      }
                      onChange={(e) => {
                        setEditingTrackingOrderId(selectedOrderDetails.id);
                        setTrackingInputVal(e.target.value);
                      }}
                      className="tracking-input-field"
                    />
                    <button
                      type="button"
                      className="btn btn-primary tracking-save-btn"
                      disabled={savingTracking}
                      onClick={() =>
                        handleSaveTracking(
                          selectedOrderDetails.id,
                          editingTrackingOrderId === selectedOrderDetails.id
                            ? trackingInputVal
                            : selectedOrderDetails.trackingId || ''
                        )
                      }
                    >
                      {savingTracking ? 'Saving...' : 'Save Tracking'}
                    </button>
                  </div>
                </div>

                <div className="dispatch-control-right">
                  <span className="current-status-label">
                    Status: <strong>{selectedOrderDetails.status}</strong>
                  </span>
                  {selectedOrderDetails.status !== 'Delivered' && (
                    <button
                      type="button"
                      className="advance-action-btn modal-advance"
                      onClick={() => {
                        advanceStatus(selectedOrderDetails.id);
                        setSelectedOrderDetails((prev) => ({
                          ...prev,
                          status:
                            prev.status === 'Pending Dispatch' || prev.status === 'Confirmed' || prev.status === 'Paid'
                              ? 'Ready for Courier'
                              : prev.status === 'Ready for Courier'
                              ? 'In Transit (Bluedart)'
                              : 'Delivered',
                        }));
                      }}
                    >
                      Advance Status Step →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER PROFILE & ORDER HISTORY MODAL */}
      {selectedCustomerProfile && (
        <div className="admin-modal-overlay" onClick={() => setSelectedCustomerProfile(null)}>
          <div className="admin-modal-container customer-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="modal-title-lockup">
                <span className="modal-kicker">Client Dossier &amp; Order History</span>
                <h3 className="admin-modal-title">{selectedCustomerProfile.name}</h3>
                <span className="customer-modal-badge">{selectedCustomerProfile.status}</span>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedCustomerProfile(null)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="customer-profile-modal-body">
              {/* Profile summary cards */}
              <div className="customer-metrics-row">
                <div className="cust-metric-card">
                  <span className="cust-metric-label">Lifetime Spend</span>
                  <strong className="cust-metric-value">₹{selectedCustomerProfile.totalSpend || 0}</strong>
                </div>
                <div className="cust-metric-card">
                  <span className="cust-metric-label">Orders Placed</span>
                  <strong className="cust-metric-value">{selectedCustomerProfile.ordersCount || 0}</strong>
                </div>
                <div className="cust-metric-card">
                  <span className="cust-metric-label">Authentication</span>
                  <strong className="cust-metric-value">{selectedCustomerProfile.authProvider || 'Store Client'}</strong>
                </div>
                <div className="cust-metric-card">
                  <span className="cust-metric-label">Joined</span>
                  <strong className="cust-metric-value">{selectedCustomerProfile.joinedDate || 'Nov 2026'}</strong>
                </div>
              </div>

              {/* Contact info and saved addresses */}
              <div className="customer-contact-addresses-grid">
                <div className="cust-info-card">
                  <h4>Contact Channels</h4>
                  <div className="contact-info-list">
                    <p>
                      <strong>Phone:</strong>{' '}
                      {selectedCustomerProfile.phone ? (
                        <a href={`tel:${selectedCustomerProfile.phone}`} className="phone-badge-link">
                          <Phone size={13} /> {selectedCustomerProfile.phone}
                        </a>
                      ) : (
                        'None on record'
                      )}
                    </p>
                    <p>
                      <strong>Email:</strong>{' '}
                      {selectedCustomerProfile.email ? (
                        <a href={`mailto:${selectedCustomerProfile.email}`} className="email-badge-link">
                          <Mail size={13} /> {selectedCustomerProfile.email}
                        </a>
                      ) : (
                        'None on record'
                      )}
                    </p>
                  </div>
                </div>

                <div className="cust-info-card">
                  <h4>Saved Shipping Addresses ({(selectedCustomerProfile.addresses || []).length})</h4>
                  <div className="saved-addresses-list">
                    {(selectedCustomerProfile.addresses || []).length > 0 ? (
                      selectedCustomerProfile.addresses.map((a, i) => (
                        <div key={i} className="saved-address-item">
                          <MapPin size={14} className="addr-pin-icon" />
                          <div>
                            <p className="addr-main-line">{a.address || a.formatted}</p>
                            {(a.city || a.pincode) && (
                              <p className="addr-city-sub">
                                {a.city}{a.state ? `, ${a.state}` : ''} {a.pincode ? `- ${a.pincode}` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="no-address">No saved shipping addresses found.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order History */}
              <div className="customer-orders-history-section">
                <h4>Orders on Record ({(selectedCustomerProfile.orders || []).length})</h4>
                <div className="modal-items-table-wrap">
                  <table className="modal-items-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Settlement</th>
                        <th>Value</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedCustomerProfile.orders || []).length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '16px', color: '#6B7280' }}>
                            No past orders on record.
                          </td>
                        </tr>
                      ) : (
                        selectedCustomerProfile.orders.map((o, idx) => (
                          <tr key={o.id || idx}>
                            <td><strong>{o.orderNumber || o.id}</strong></td>
                            <td>{o.date}</td>
                            <td>{o.paymentMethod || 'Razorpay'}</td>
                            <td>₹{o.amount}</td>
                            <td><span className="status-badge-cell">{o.status}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
