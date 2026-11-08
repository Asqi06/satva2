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

export default function AdminClient() {
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

  // Fetch live products, banners, orders, and coupons from MongoDB Atlas on mount
  useEffect(() => {
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
    fetch('/api/orders')
      .then(safeJson)
      .then((data) => {
        if (data && data.orders && data.orders.length > 0) {
          setApiOrders(data.orders);
        }
      })
      .catch(() => {});

    // 4. Live Coupons
    fetch('/api/coupons')
      .then(safeJson)
      .then((data) => {
        if (data && data.coupons && data.coupons.length > 0) {
          setApiCoupons(data.coupons);
        }
      })
      .catch(() => {});

    // 5. Live Categories
    fetch('/api/categories?all=true')
      .then(safeJson)
      .then((data) => {
        if (data && data.categories && data.categories.length > 0) {
          setCategoriesList(data.categories);
        }
      })
      .catch(() => {});
  }, []);

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
      client: o.customer || o.client || 'Client',
      city: o.city ? `${o.city}, India` : (o.address?.split(',')?.[1] || 'India'),
      items: (o.items || []).map((it) => it.title || 'Piece').join(', ') || 'Atelier Piece',
      value: o.amount || o.value || 0,
      payment: o.paymentMethod || 'Razorpay',
      status: o.status || 'Confirmed',
      created: o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Recently',
    }));

    const formattedLive = (liveOrders || []).map((o) => ({
      id: o.orderId,
      client: o.clientName || o.destination?.split(',')?.[0] || 'Client Order',
      city: o.destination?.split(',')?.[1] || 'India',
      items:
        o.items
          ?.map((it) => it.title.split(' ')[0] + ' ' + (it.subcategory || 'Piece'))
          .join(', ') || 'Atelier Jewellery',
      value: o.total,
      payment: o.paymentMethod?.includes('Cash') ? 'COD' : 'UPI Prepaid',
      status: o.status || 'Pending Dispatch',
      created: o.date || 'Just now',
    }));

    const existingIds = new Set([...formattedApi.map((o) => o.id), ...formattedLive.map((o) => o.id)]);
    const dedupedHistorical = initialOrdersQueue.filter((o) => !existingIds.has(o.id));
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
    if (next === 'Pending Dispatch' || next === 'Confirmed' || next === 'Paid') next = 'Ready for Courier';
    else if (next === 'Ready for Courier') next = 'In Transit (Bluedart)';
    else if (next === 'In Transit (Bluedart)' || next === 'Dispatched') next = 'Delivered';

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

  const filteredOrders =
    filterStatus === 'all'
      ? orders
      : orders.filter((o) => o.status.toLowerCase().includes(filterStatus.toLowerCase()));

  // Filtered Customers
  const filteredCustomers = (registeredUsers || []).filter((u) => {
    if (!customerSearch.trim()) return true;
    const term = customerSearch.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.id?.toLowerCase().includes(term)
    );
  });

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
            <span>Customer Directory ({registeredUsers.length})</span>
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

        {/* TAB 3: CUSTOMER DIRECTORY & GOOGLE ACCOUNTS */}
        {activeTab === 'customers' && (
          <section className="admin-card-section">
            <div className="admin-card-header">
              <div>
                <h2 className="admin-card-title">Registered Customer Directory</h2>
                <p className="admin-card-subtitle">
                  Clients authenticated via Google Sign-In and orders on record. All user data, saved shipping addresses, and spend history are synchronized here.
                </p>
              </div>

              <div className="admin-search-box">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by client name or email..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="admin-search-input"
                />
              </div>
            </div>

            <div className="orders-table-wrapper">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Client Profile</th>
                    <th>Authentication</th>
                    <th>Joined</th>
                    <th>Orders Count</th>
                    <th>Total Spend</th>
                    <th>Default Shipping Address</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((cust) => {
                    const defaultAddress = cust.addresses?.[0];
                    return (
                      <tr key={cust.id}>
                        <td>
                          <strong>{cust.name}</strong>
                          <span className="customer-email-sub">{cust.email}</span>
                        </td>
                        <td>
                          <span className="google-auth-badge">
                            <span className="google-dot">G</span> Google Verified
                          </span>
                        </td>
                        <td>{cust.joinedDate || 'Nov 2026'}</td>
                        <td>
                          <strong>{cust.ordersCount || 0}</strong>
                        </td>
                        <td className="value-cell">₹{cust.totalSpend || 0}</td>
                        <td className="address-snippet-cell">
                          {defaultAddress ? (
                            <span>
                              {defaultAddress.address}, {defaultAddress.city} {defaultAddress.pincode}
                            </span>
                          ) : (
                            <span className="no-address">No saved address yet</span>
                          )}
                        </td>
                        <td>
                          <span className="client-tier-chip">{cust.status || 'Active Member'}</span>
                        </td>
                      </tr>
                    );
                  })}
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
                <h2 className="admin-card-title">Order Dispatch Queue</h2>
                <p className="admin-card-subtitle">Verify items and advance status for courier pickup</p>
              </div>

              <div className="admin-filter-bar">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="admin-select"
                  aria-label="Filter orders by status"
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending dispatch</option>
                  <option value="courier">Ready for courier</option>
                  <option value="transit">In transit</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
            </div>

            <div className="orders-table-wrapper">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Order Reference</th>
                    <th>Client & City</th>
                    <th>Items Ordered</th>
                    <th>Settlement</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id}>
                      <td>
                        <span className="order-id-badge">{ord.id}</span>
                        <span className="order-time-sub">{ord.created}</span>
                      </td>
                      <td>
                        <strong>{ord.client}</strong>
                        <span className="city-sub">{ord.city}</span>
                      </td>
                      <td className="items-cell">{ord.items}</td>
                      <td>
                        <span className={`payment-pill ${ord.payment.includes('UPI') ? 'is-upi' : 'is-cod'}`}>
                          {ord.payment}
                        </span>
                      </td>
                      <td className="value-cell">₹{ord.value}</td>
                      <td>
                        <span className="status-badge-cell">{ord.status}</span>
                      </td>
                      <td>
                        {ord.status !== "Delivered" ? (
                          <button
                            type="button"
                            className="advance-action-btn"
                            onClick={() => advanceStatus(ord.id)}
                          >
                            Advance Step →
                          </button>
                        ) : (
                          <span className="complete-indicator">✓ Complete</span>
                        )}
                      </td>
                    </tr>
                  ))}
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
    </div>
  );
}
