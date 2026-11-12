'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import './page.css';

export default function CheckoutClient() {
  const {
    cart,
    subtotal,
    shippingCost,
    appliedVoucher,
    voucherDiscount,
    placeOrder,
    recordPlacedOrder,
    clearCart,
    currentUser,
  } = useCart();

  const [formData, setFormData] = useState(() => {
    const defaultAddr = currentUser?.addresses?.[0];
    return {
      fullName: defaultAddr?.fullName || currentUser?.name || '',
      phone: defaultAddr?.phone || '+91 98765 43210',
      email: currentUser?.email || '',
      pincode: defaultAddr?.pincode || '',
      city: defaultAddr?.city || '',
      state: defaultAddr?.state || '',
      address: defaultAddr?.address || '',
      landmark: defaultAddr?.landmark || '',
    };
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const prepaidDiscount = paymentMethod === 'upi' ? 50 : 0;
  const total = Math.max(0, subtotal - voucherDiscount - prepaidDiscount + shippingCost);

  // Dynamically load Razorpay Checkout script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        return resolve(true);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Mock auto pincode detection for popular regions
    if (name === 'pincode' && value.length === 6) {
      if (value.startsWith('400')) {
        setFormData((prev) => ({ ...prev, city: 'Mumbai', state: 'Maharashtra' }));
      } else if (value.startsWith('110')) {
        setFormData((prev) => ({ ...prev, city: 'New Delhi', state: 'Delhi' }));
      } else if (value.startsWith('560')) {
        setFormData((prev) => ({ ...prev, city: 'Bengaluru', state: 'Karnataka' }));
      } else if (value.startsWith('500')) {
        setFormData((prev) => ({ ...prev, city: 'Hyderabad', state: 'Telangana' }));
      } else if (value.startsWith('600')) {
        setFormData((prev) => ({ ...prev, city: 'Chennai', state: 'Tamil Nadu' }));
      } else if (value.startsWith('700')) {
        setFormData((prev) => ({ ...prev, city: 'Kolkata', state: 'West Bengal' }));
      } else if (value.startsWith('380')) {
        setFormData((prev) => ({ ...prev, city: 'Ahmedabad', state: 'Gujarat' }));
      } else if (value.startsWith('302')) {
        setFormData((prev) => ({ ...prev, city: 'Jaipur', state: 'Rajasthan' }));
      } else if (value.startsWith(' Pune') || value.startsWith('411')) {
        setFormData((prev) => ({ ...prev, city: 'Pune', state: 'Maharashtra' }));
      }
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0 || isProcessing) return;
    setErrorMessage('');
    setIsProcessing(true);

    try {
      if (paymentMethod === 'upi') {
        // Step 1: Create Razorpay Order on server
        const createRes = await fetch('/api/checkout/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart,
            couponCode: appliedVoucher?.code || '',
            paymentMethod: 'upi',
            notes: {
              customerName: formData.fullName,
              customerPhone: formData.phone,
              pincode: formData.pincode,
            },
          }),
        });

        const orderData = await createRes.json();
        if (!orderData.success || !orderData.orderId) {
          throw new Error(orderData.error || 'Failed to initialize payment gateway.');
        }

        // Step 2: Load Checkout.js
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error('Unable to load Razorpay payment SDK. Check your internet connection.');
        }

        // Step 3: Trigger Razorpay Modal
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'Satvastones',
          description: 'Anti-Tarnish Demi-Fine Jewellery',
          image: '/logo.png',
          order_id: orderData.orderId,
          handler: async function (response) {
            try {
              // Step 4: Verify signature on server & record order in MongoDB
              const verifyRes = await fetch('/api/checkout/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  customer: formData,
                  items: cart,
                  amount: orderData.orderSummary.total,
                  discountAmount: orderData.orderSummary.discountAmount,
                  couponCode: appliedVoucher?.code || '',
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                const confirmed = {
                  orderId: verifyData.orderNumber,
                  mongoId: verifyData.orderId,
                  trackingNumber: verifyData.trackingId,
                  paymentMethod: 'Prepaid UPI / Online (Razorpay Verified)',
                  paymentId: response.razorpay_payment_id,
                  total: orderData.orderSummary.total,
                  destination: `${formData.address}, ${formData.city} ${formData.pincode}`,
                  items: [...cart],
                  status: 'Confirmed',
                  email: formData.email,
                  fullName: formData.fullName,
                };
                if (recordPlacedOrder) {
                  recordPlacedOrder(confirmed);
                } else {
                  clearCart();
                }
                setConfirmedOrder(confirmed);
                setIsSubmitted(true);
              } else {
                setErrorMessage(verifyData.error || 'Payment verification failed.');
              }
            } catch (err) {
              console.error('Signature verification error:', err);
              setErrorMessage('Payment verification error. Please contact Satvastones support.');
            } finally {
              setIsProcessing(false);
            }
          },
          prefill: {
            name: formData.fullName,
            email: formData.email,
            contact: formData.phone.replace(/[^0-9]/g, ''),
          },
          theme: {
            color: '#1a2e1d', // Satvastones deep forest green
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
              setErrorMessage('Payment window was closed. You may retry or choose Cash on Delivery.');
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        // Cash on Delivery (COD) -> Directly insert into MongoDB Atlas
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: formData,
            items: cart.map((it) => ({
              id: String(it.id),
              title: it.title,
              price: it.price,
              qty: it.quantity,
              finish: it.finish || '18K Gold',
            })),
            total,
            discountAmount: voucherDiscount,
            couponCode: appliedVoucher?.code || '',
            paymentMethod: 'Cash on Delivery (COD)',
          }),
        });

        const data = await res.json();
        if (data.success) {
          const confirmed = {
            orderId: data.orderNumber,
            mongoId: data.orderId,
            trackingNumber: data.order?.trackingId || `BD-${Math.floor(10000000 + Math.random() * 90000000)}-IN`,
            paymentMethod: 'Cash on Delivery',
            total: data.order?.amount ?? total,
            destination: `${formData.address}, ${formData.city} ${formData.pincode}`,
            items: [...cart],
            status: 'Confirmed',
            email: formData.email,
            fullName: formData.fullName,
          };
          if (recordPlacedOrder) {
            recordPlacedOrder(confirmed);
          } else {
            clearCart();
          }
          setConfirmedOrder(confirmed);
          setIsSubmitted(true);
        } else {
          throw new Error(data.error || 'Failed to place COD order.');
        }
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Order placement error:', err);
      setErrorMessage(err.message || 'An error occurred while placing your order.');
      setIsProcessing(false);
    }
  };

  if (isSubmitted && confirmedOrder) {
    return (
      <div className="container checkout-success-wrapper">
        <div className="success-card">
          <div className="success-icon-frame">
            <CheckCircle2 size={36} color="var(--forest)" />
          </div>
          <span className="success-kicker">Order Confirmed</span>
          <h1 className="success-headline">Thank you for your order, {formData.fullName || "valued client"}.</h1>
          <p className="success-order-number">
            Order Reference: <strong>{confirmedOrder.orderId}</strong>
          </p>
          <p className="success-description">
            We have dispatched your order details and invoice to <strong>{formData.phone || "+91 98765 43210"}</strong> via WhatsApp and SMS. Your anti-tarnish jewelry will be carefully packaged inside a microfiber travel pouch and shipped from Mumbai within 24 hours via Bluedart Express.
          </p>

          <div className="success-details-box">
            <div className="success-line">
              <span>Payment method:</span>
              <strong>{confirmedOrder.paymentMethod}</strong>
            </div>
            {confirmedOrder.paymentId && (
              <div className="success-line">
                <span>Razorpay Payment ID:</span>
                <code>{confirmedOrder.paymentId}</code>
              </div>
            )}
            <div className="success-line">
              <span>Bluedart Tracking ID:</span>
              <strong>{confirmedOrder.trackingNumber || 'BD-48920194-IN'}</strong>
            </div>
            <div className="success-line">
              <span>Amount {confirmedOrder.paymentMethod.includes('Cash') ? 'due at delivery' : 'paid online'}:</span>
              <strong>₹{confirmedOrder.total}</strong>
            </div>
            <div className="success-line">
              <span>Delivery destination:</span>
              <span>{confirmedOrder.destination}</span>
            </div>
            <div className="success-line">
              <span>Items ordered:</span>
              <span>{confirmedOrder.items.map(i => `${i.title} (${i.finish || '18K Gold'}) x${i.quantity || 1}`).join(', ')}</span>
            </div>
          </div>

          <div className="success-actions-row">
            <Link href="/" className="btn btn-primary">
              Return to atelier home
            </Link>
            <Link href="/account" className="btn btn-secondary">
              Track in client portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0 && !isSubmitted) {
    return (
      <div className="container checkout-success-wrapper">
        <div className="success-card">
          <h1 className="success-headline">Your shopping bag is empty</h1>
          <p className="success-description">
            Please add items to your shopping bag before proceeding to checkout.
          </p>
          <div className="success-actions-row">
            <Link href="/anti-tarnish-jewellery" className="btn btn-primary">
              Browse Anti-Tarnish Collection
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-shell">
      {/* Clean Distraction-Free Header */}
      <header className="checkout-minimal-header">
        <div className="container header-inner">
          <Link href="/" className="checkout-brand-link" aria-label="Satvastones Homepage">
            <Image
              src="/logo.png"
              alt="Satvastones"
              width={165}
              height={50}
              priority
              className="checkout-brand-image"
            />
          </Link>
          <div className="checkout-security-tag">
            <Lock size={14} />
            <span>256-bit Encrypted Checkout</span>
          </div>
        </div>
      </header>

      <div className="container checkout-main-layout">
        {/* Left Column: Delivery & Payment Details */}
        <form onSubmit={handlePlaceOrder} className="checkout-form-col">
          {/* Section 1: Contact Details */}
          <section className="checkout-section-block">
            <div className="section-step-header">
              <span className="step-number">1</span>
              <h2>Contact details</h2>
            </div>
            <div className="form-fields-grid">
              <div className="field-group full-width">
                <label htmlFor="fullName">Full name *</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  placeholder="e.g. Radhika Apte"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>

              <div className="field-group">
                <label htmlFor="phone">Mobile phone number *</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={formData.phone}
                  onChange={handleChange}
                />
                <span className="field-helper">Order updates sent via WhatsApp</span>
              </div>

              <div className="field-group">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="For digital tax invoice"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          {/* Section 2: Delivery Address */}
          <section className="checkout-section-block">
            <div className="section-step-header">
              <span className="step-number">2</span>
              <h2>Delivery destination</h2>
            </div>
            <div className="form-fields-grid">
              <div className="field-group">
                <label htmlFor="pincode">Pincode *</label>
                <input
                  id="pincode"
                  name="pincode"
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 400050"
                  value={formData.pincode}
                  onChange={handleChange}
                />
              </div>

              <div className="field-group">
                <label htmlFor="city">City / District *</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>

              <div className="field-group full-width">
                <label htmlFor="address">Flat / House No., Building, Street *</label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  required
                  placeholder="e.g. Flat 402, Lotus Court, Linking Road"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="field-group full-width">
                <label htmlFor="landmark">Landmark (optional)</label>
                <input
                  id="landmark"
                  name="landmark"
                  type="text"
                  placeholder="Near National College"
                  value={formData.landmark}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          {/* Section 3: Payment Choice */}
          <section className="checkout-section-block">
            <div className="section-step-header">
              <span className="step-number">3</span>
              <h2>Payment method</h2>
            </div>

            <div className="payment-options-stack">
              {/* Option A: Cash on Delivery */}
              <label className={`payment-method-tile ${paymentMethod === 'cod' ? 'is-selected' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                <div className="method-label-block">
                  <span className="method-title">Cash on Delivery (COD)</span>
                  <span className="method-caption">Pay cash or UPI to the courier agent upon doorstep delivery</span>
                </div>
                <span className="method-tag">No advance payment</span>
              </label>

              {/* Option B: Prepaid UPI with Discount */}
              <label className={`payment-method-tile ${paymentMethod === 'upi' ? 'is-selected' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                />
                <div className="method-label-block">
                  <span className="method-title">Instant UPI / QR / Net Banking</span>
                  <span className="method-caption">Google Pay, PhonePe, Paytm, or Credit Card</span>
                </div>
                <span className="method-tag tag-discount">Save ₹50 extra</span>
              </label>
            </div>
          </section>

          {errorMessage && (
            <div className="checkout-error-banner" style={{ padding: '12px 16px', background: '#fdf2f2', border: '1px solid #f8b4b4', borderRadius: '4px', color: '#9b1c1c', fontSize: '0.88rem', marginBottom: '16px' }}>
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary place-order-action"
            disabled={isProcessing}
            style={{ opacity: isProcessing ? 0.7 : 1, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
          >
            {isProcessing
              ? (paymentMethod === 'upi' ? 'Opening Razorpay UPI...' : 'Confirming Order...')
              : paymentMethod === 'upi'
              ? `Proceed to UPI / Card Payment (₹${total})`
              : `Complete Cash on Delivery Order (₹${total})`}
            {!isProcessing && <ArrowRight size={16} style={{ marginLeft: 6 }} />}
          </button>
        </form>

        {/* Right Column: Order Summary */}
        <aside className="checkout-order-sidebar">
          <div className="order-summary-box">
            <h3 className="summary-title">Your Order ({cart.length})</h3>

            <div className="summary-items-list">
              {cart.map((item) => (
                <div key={`${item.id}-${item.finish}`} className="summary-item-line">
                  <div className="item-details">
                    <span className="item-name">{item.title}</span>
                    <span className="item-meta">Qty: {item.quantity} • {item.finish}</span>
                  </div>
                  <span className="item-cost">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="summary-totals-table">
              <div className="total-row">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              {voucherDiscount > 0 && (
                <div className="total-row discount-row">
                  <span>Privilege ({appliedVoucher?.code})</span>
                  <span>-₹{voucherDiscount}</span>
                </div>
              )}
              {prepaidDiscount > 0 && (
                <div className="total-row discount-row">
                  <span>Prepaid UPI discount</span>
                  <span>-₹{prepaidDiscount}</span>
                </div>
              )}
              <div className="total-row">
                <span>Delivery</span>
                <span>{shippingCost === 0 ? 'Complimentary' : `₹${shippingCost}`}</span>
              </div>
              <div className="total-row final-total-row">
                <span>Total amount</span>
                <span>₹{total}</span>
              </div>
            </div>

            <div className="checkout-assurance-strip">
              <div className="assurance-item">
                <ShieldCheck size={18} className="color-gold" />
                <span>18k PVD anti-tarnish guarantee</span>
              </div>
              <div className="assurance-item">
                <CheckCircle2 size={18} className="color-gold" />
                <span>7-day doorstep replacement</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
