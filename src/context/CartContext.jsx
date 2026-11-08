'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { products, getProductById } from '../data/products';
import { DEFAULT_PROMO_BANNERS, DEFAULT_VOUCHERS } from '../data/promotions';

export { DEFAULT_PROMO_BANNERS, DEFAULT_VOUCHERS };

export const defaultCartContextValue = {
  cart: [],
  wishlist: [],
  orders: [],
  currentUser: null,
  registeredUsers: [],
  vouchers: DEFAULT_VOUCHERS,
  isHydrated: true,
  itemCount: 0,
  subtotal: 0,
  totalMrp: 0,
  totalSavings: 0,
  freeShippingThreshold: 499,
  isFreeShipping: true,
  amountToFreeShipping: 0,
  shippingCost: 0,
  appliedVoucher: null,
  voucherDiscount: 0,
  voucherError: '',
  grandTotal: 0,
  isMiniBagOpen: false,
  toastMessage: null,
  addToCart: () => {},
  addBundleToCart: () => {},
  updateQuantity: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  toggleWishlist: () => {},
  isWishlisted: () => false,
  applyVoucher: () => false,
  removeVoucher: () => {},
  addVoucher: () => {},
  updateVoucher: () => {},
  deleteVoucher: () => {},
  toggleVoucherActive: () => {},
  resetVouchersToDefault: () => {},
  signInWithGoogle: () => {},
  signOut: () => {},
  updateUserAddress: () => {},
  placeOrder: () => {},
  promoBanners: DEFAULT_PROMO_BANNERS,
  addPromoBanner: () => {},
  updatePromoBanner: () => {},
  deletePromoBanner: () => {},
  toggleBannerActive: () => {},
  moveBanner: () => {},
  resetBannersToDefault: () => {},
  openMiniBag: () => {},
  closeMiniBag: () => {},
};

const CartContext = createContext(defaultCartContextValue);

const DEFAULT_INITIAL_CART = [];

const DEFAULT_WISHLIST = [];

export const DEFAULT_CUSTOMERS = [
  {
    id: "cust-1",
    name: "Radhika Apte",
    email: "radhika.apte@gmail.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    provider: "google",
    joinedDate: "15 Sep 2026",
    ordersCount: 2,
    totalSpend: 2246,
    status: "VIP Tier",
    addresses: [
      {
        id: "addr-1",
        isDefault: true,
        fullName: "Radhika Apte",
        address: "Flat 402, Lotus Court, Linking Road",
        landmark: "Near National College",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400050",
        phone: "+91 98765 43210",
      },
    ],
  },
  {
    id: "cust-2",
    name: "Meera Nair",
    email: "meera.nair@gmail.com",
    avatar: "",
    provider: "google",
    joinedDate: "02 Oct 2026",
    ordersCount: 1,
    totalSpend: 1199,
    status: "Active",
    addresses: [],
  },
];

const SAMPLE_ORDERS = [
  {
    orderId: "SATVA-849201",
    date: "05 Nov 2026",
    status: "In Transit",
    carrier: "Bluedart Express",
    trackingNumber: "BD-884920194-IN",
    destination: "Bandra West, Mumbai 400050",
    total: 1148,
    paymentMethod: "Cash on Delivery",
    items: [
      {
        id: 101,
        title: "18K Gold Plated Serpent Herringbone Chain",
        finish: "18K Gold",
        price: 499,
        quantity: 1,
      },
      {
        id: 103,
        title: "Celestial Roman Numeral Bangle Bracelet",
        finish: "18K Gold",
        price: 599,
        quantity: 1,
      },
    ],
  },
];

export function CartProvider({ children }) {
  const [cart, setCart] = useState(DEFAULT_INITIAL_CART);
  const [wishlist, setWishlist] = useState(DEFAULT_WISHLIST);
  const [orders, setOrders] = useState(SAMPLE_ORDERS);
  const [promoBanners, setPromoBanners] = useState(DEFAULT_PROMO_BANNERS);
  const [currentUser, setCurrentUser] = useState(null);
  const [registeredUsers, setRegisteredUsers] = useState(DEFAULT_CUSTOMERS);
  const [vouchers, setVouchers] = useState(DEFAULT_VOUCHERS);
  const [isHydrated, setIsHydrated] = useState(false);

  const [isMiniBagOpen, setIsMiniBagOpen] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Restore client state from localStorage once mounted
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('satva_cart_v2');
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedWishlist = localStorage.getItem('satva_wishlist_v2');
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

      const savedOrders = localStorage.getItem('satva_orders_v2');
      if (savedOrders) setOrders(JSON.parse(savedOrders));

      const savedBanners = localStorage.getItem('satva_promo_banners');
      if (savedBanners) setPromoBanners(JSON.parse(savedBanners));

      const savedUser = localStorage.getItem('satva_user');
      if (savedUser) setCurrentUser(JSON.parse(savedUser));

      const savedCust = localStorage.getItem('satva_customers');
      if (savedCust) setRegisteredUsers(JSON.parse(savedCust));

      const savedVouchers = localStorage.getItem('satva_vouchers');
      if (savedVouchers) setVouchers(JSON.parse(savedVouchers));
    } catch (e) {
      console.error('Failed to restore from localStorage:', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Sync back to localStorage only after initial client hydration completes
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('satva_cart_v2', JSON.stringify(cart));
    } catch {}
  }, [cart, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('satva_wishlist_v2', JSON.stringify(wishlist));
    } catch {}
  }, [wishlist, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('satva_orders_v2', JSON.stringify(orders));
    } catch {}
  }, [orders, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('satva_promo_banners', JSON.stringify(promoBanners));
    } catch {}
  }, [promoBanners, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (currentUser) {
        localStorage.setItem('satva_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('satva_user');
      }
    } catch {}
  }, [currentUser, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('satva_customers', JSON.stringify(registeredUsers));
    } catch {}
  }, [registeredUsers, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('satva_vouchers', JSON.stringify(vouchers));
    } catch {}
  }, [vouchers, isHydrated]);

  // Show auto-dismissing toast notification
  const showToast = (text) => {
    setToastMessage(text);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Add item to cart
  const addToCart = (item, quantity = 1, options = { openDrawer: true }) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.id === item.id && (i.finish === item.finish || !item.finish)
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }

      return [
        ...prev,
        {
          id: item.id,
          title: item.title,
          price: item.price,
          mrp: item.mrp || item.price * 2,
          finish: item.finish || item.colors?.[0] || "18K Gold",
          quantity,
          imageBg: item.imageBg || "linear-gradient(135deg, #f7efe2 0%, #ecdcc3 100%)",
          subcategory: item.subcategory || "Jewellery",
          category: item.category || "anti-tarnish",
        },
      ];
    });

    showToast(`Added "${item.title.slice(0, 32)}..." to your bag`);

    if (options.openDrawer) {
      setIsMiniBagOpen(true);
    }
  };

  // Add multiple items (e.g. from bundle)
  const addBundleToCart = (bundleItems, bundleName) => {
    bundleItems.forEach((item) => {
      addToCart(item, 1, { openDrawer: false });
    });
    showToast(`Added ${bundleName || 'Curated Set'} to your bag`);
    setIsMiniBagOpen(true);
  };

  // Update item quantity
  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  // Remove single item
  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    showToast("Item removed from your bag");
  };

  // Clear all items
  const clearCart = () => {
    setCart([]);
  };

  // Wishlist toggle
  const toggleWishlist = (productId) => {
    const numericId = Number(productId);
    setWishlist((prev) => {
      const exists = prev.includes(numericId);
      if (exists) {
        showToast("Removed from saved pieces");
        return prev.filter((id) => id !== numericId);
      } else {
        showToast("Saved to your wishlist");
        return [...prev, numericId];
      }
    });
  };

  const isWishlisted = (productId) => {
    return wishlist.includes(Number(productId));
  };

  // Customer Authentication (Google Sign-In)
  const signInWithGoogle = (profileData = {}) => {
    const defaultGoogleUser = {
      id: `cust-${Date.now()}`,
      name: profileData.name || "Aditi Sharma",
      email: profileData.email || "aditi.sharma@gmail.com",
      avatar: profileData.avatar || "",
      provider: "google",
      joinedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      ordersCount: 0,
      totalSpend: 0,
      status: "Verified Client",
      addresses: [
        {
          id: `addr-${Date.now()}`,
          isDefault: true,
          fullName: profileData.name || "Aditi Sharma",
          address: "Flat 301, Ocean View Apts, Juhu Tara Road",
          landmark: "Near Soho House",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400049",
          phone: "+91 98200 12345",
        },
      ],
    };

    setCurrentUser(defaultGoogleUser);
    setRegisteredUsers((prev) => {
      const exists = prev.some((u) => u.email.toLowerCase() === defaultGoogleUser.email.toLowerCase());
      if (exists) return prev;
      return [defaultGoogleUser, ...prev];
    });

    showToast(`Signed in with Google as ${defaultGoogleUser.name}`);
    return defaultGoogleUser;
  };

  const signOut = () => {
    setCurrentUser(null);
    showToast("Signed out successfully");
  };

  const updateUserAddress = (newAddress) => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      addresses: [
        {
          ...newAddress,
          id: newAddress.id || `addr-${Date.now()}`,
          isDefault: true,
        },
      ],
    };
    setCurrentUser(updatedUser);
    setRegisteredUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? updatedUser : u))
    );
    showToast("Delivery address updated successfully");
  };

  // Dynamic Vouchers Engine (controlled via Admin Panel)
  const applyVoucher = (code) => {
    const clean = code.trim().toUpperCase();
    const found = vouchers.find((v) => v.code === clean && v.active !== false);

    if (!found) {
      setVoucherError(`Invalid or expired voucher: ${clean}`);
      return false;
    }

    if (found.minOrder && subtotal < found.minOrder) {
      setVoucherError(`Code ${clean} requires minimum cart value of ₹${found.minOrder}.`);
      return false;
    }

    if (found.minItems && itemCount < found.minItems) {
      setVoucherError(`Code ${clean} requires at least ${found.minItems} pieces in bag.`);
      return false;
    }

    const calculatedDiscount =
      found.type === 'fixed'
        ? Math.min(subtotal, found.value)
        : Math.round((subtotal * found.value) / 100);

    setAppliedVoucher({
      code: found.code,
      type: found.type,
      value: found.value,
      discount: calculatedDiscount,
      label: found.type === 'fixed' ? `₹${found.value} Off` : `${found.value}% Off`,
    });
    setVoucherError('');
    showToast(`Voucher ${found.code} applied: ${found.type === 'fixed' ? `₹${found.value} off` : `${found.value}% off`}`);
    return true;
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherError('');
    showToast('Voucher removed');
  };

  const addVoucher = (newVoucher) => {
    const voucher = {
      ...newVoucher,
      code: newVoucher.code.trim().toUpperCase(),
      active: newVoucher.active !== false,
      minOrder: Number(newVoucher.minOrder) || 0,
      value: Number(newVoucher.value) || 0,
    };
    setVouchers((prev) => [voucher, ...prev.filter((v) => v.code !== voucher.code)]);
    showToast(`Privilege voucher ${voucher.code} added`);
    return voucher;
  };

  const updateVoucher = (code, updatedFields) => {
    setVouchers((prev) =>
      prev.map((v) => (v.code === code ? { ...v, ...updatedFields } : v))
    );
    showToast(`Voucher ${code} updated`);
  };

  const deleteVoucher = (code) => {
    setVouchers((prev) => prev.filter((v) => v.code !== code));
    showToast(`Voucher ${code} deleted`);
  };

  const toggleVoucherActive = (code) => {
    setVouchers((prev) =>
      prev.map((v) => (v.code === code ? { ...v, active: !v.active } : v))
    );
  };

  const resetVouchersToDefault = () => {
    setVouchers(DEFAULT_VOUCHERS);
    showToast("Reset privilege vouchers to atelier defaults");
  };

  // Place order from checkout
  const placeOrder = (orderData) => {
    const generatedId = `SATVA-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder = {
      orderId: generatedId,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: "Confirmed",
      carrier: "Bluedart Express",
      trackingNumber: `BD-${Math.floor(100000000 + Math.random() * 900000000)}-IN`,
      destination: `${orderData.address}, ${orderData.city} ${orderData.pincode}`,
      total: orderData.total,
      paymentMethod: orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Prepaid UPI',
      items: [...cart],
      userEmail: currentUser?.email || orderData.email || null,
      clientName: currentUser?.name || orderData.fullName || "Client",
    };

    setOrders((prev) => [newOrder, ...prev]);

    // If user is logged in, bump stats
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        ordersCount: (currentUser.ordersCount || 0) + 1,
        totalSpend: (currentUser.totalSpend || 0) + orderData.total,
      };
      setCurrentUser(updatedUser);
      setRegisteredUsers((prev) =>
        prev.map((u) => (u.id === currentUser.id ? updatedUser : u))
      );
    }

    clearCart();
    setAppliedVoucher(null);
    return newOrder;
  };

  // Promo banner management (controlled via Admin Panel)
  const addPromoBanner = (newBanner) => {
    const banner = {
      ...newBanner,
      id: `banner-${Date.now()}`,
      active: newBanner.active !== false,
      showOverlay: newBanner.showOverlay !== false,
    };
    setPromoBanners((prev) => [banner, ...prev]);
    showToast("Promotional banner added successfully");
    return banner;
  };

  const updatePromoBanner = (id, updatedFields) => {
    setPromoBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updatedFields } : b))
    );
    showToast("Promotional banner updated");
  };

  const deletePromoBanner = (id) => {
    setPromoBanners((prev) => prev.filter((b) => b.id !== id));
    showToast("Promotional banner deleted");
  };

  const toggleBannerActive = (id) => {
    setPromoBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, active: !b.active } : b))
    );
  };

  const moveBanner = (index, direction) => {
    setPromoBanners((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const resetBannersToDefault = () => {
    setPromoBanners(DEFAULT_PROMO_BANNERS);
    showToast("Reset promotional banners to atelier defaults");
  };

  // Calculations
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalMrp = cart.reduce((sum, item) => sum + (item.mrp || item.price * 2) * item.quantity, 0);
  const totalSavings = Math.max(0, totalMrp - subtotal);

  const freeShippingThreshold = 499;
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const shippingCost = subtotal === 0 || isFreeShipping ? 0 : 49;

  let voucherDiscount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.type === 'fixed') {
      voucherDiscount = Math.min(subtotal, appliedVoucher.value);
    } else if (appliedVoucher.type === 'percent') {
      voucherDiscount = Math.round((subtotal * appliedVoucher.value) / 100);
    }
  }

  const grandTotal = Math.max(0, subtotal - voucherDiscount + shippingCost);

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        orders,
        currentUser,
        registeredUsers,
        vouchers,
        isHydrated,
        itemCount,
        subtotal,
        totalMrp,
        totalSavings,
        freeShippingThreshold,
        isFreeShipping,
        amountToFreeShipping,
        shippingCost,
        appliedVoucher,
        voucherDiscount,
        voucherError,
        grandTotal,
        isMiniBagOpen,
        toastMessage,
        addToCart,
        addBundleToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        toggleWishlist,
        isWishlisted,
        applyVoucher,
        removeVoucher,
        addVoucher,
        updateVoucher,
        deleteVoucher,
        toggleVoucherActive,
        resetVouchersToDefault,
        signInWithGoogle,
        signOut,
        updateUserAddress,
        placeOrder,
        promoBanners,
        addPromoBanner,
        updatePromoBanner,
        deletePromoBanner,
        toggleBannerActive,
        moveBanner,
        resetBannersToDefault,
        openMiniBag: () => setIsMiniBagOpen(true),
        closeMiniBag: () => setIsMiniBagOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  return context || defaultCartContextValue;
}
