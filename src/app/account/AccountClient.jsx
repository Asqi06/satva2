'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Package, MapPin, Tag, Truck, CheckCircle2, ShieldCheck, LogOut, Copy, Check, Edit2, Plus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import './page.css';

// Google SVG Icon declared outside render
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export default function AccountClient() {
  const {
    currentUser,
    orders,
    vouchers,
    signInWithGoogle,
    signOut,
    updateUserAddress,
  } = useCart();

  const [activeTab, setActiveTab] = useState('orders');
  const [copiedCode, setCopiedCode] = useState(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Address edit state
  const defaultAddr = currentUser?.addresses?.[0] || {
    fullName: currentUser?.name || '',
    address: '',
    landmark: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    phone: '+91 98765 43210',
  };

  const [addrForm, setAddrForm] = useState(defaultAddr);

  // Filter orders for the current user
  const userOrders = (orders || []).filter(
    (order) => !order.userEmail || !currentUser?.email || order.userEmail.toLowerCase() === currentUser.email.toLowerCase()
  );

  const handleCopyVoucher = (code) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    updateUserAddress(addrForm);
    setIsEditingAddress(false);
  };

  const handleCustomGoogleSignIn = (e) => {
    e.preventDefault();
    if (!customEmail) return;
    const name = customName.trim() || customEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    signInWithGoogle({
      name,
      email: customEmail.trim(),
    });
    setShowCustomModal(false);
  };

  // 1. Unauthenticated View (Google Sign-In Prompt)
  if (!currentUser) {
    return (
      <div className="container account-page-wrapper">
        <div className="auth-gate-card">
          <div className="auth-gate-header">
            <span className="client-tier-pill">Satva Atelier Client Access</span>
            <h1 className="auth-gate-title">Sign In to Your Account</h1>
            <p className="auth-gate-subtitle">
              Access your real-time shipment tracking, saved delivery addresses, and unlocked Satva Privilege vouchers.
            </p>
          </div>

          <div className="auth-google-cta-box">
            <button
              type="button"
              className="google-signin-btn"
              onClick={() => signInWithGoogle({ name: "Aditi Sharma", email: "aditi.sharma@gmail.com" })}
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>

            <div className="auth-divider">
              <span>or sign in with another Google account</span>
            </div>

            <button
              type="button"
              className="google-alternate-btn"
              onClick={() => setShowCustomModal(true)}
            >
              Enter Google Account Email
            </button>
          </div>

          {/* Perks Strip */}
          <div className="auth-benefits-grid">
            <div className="auth-benefit-item">
              <ShieldCheck size={20} className="benefit-icon" />
              <div>
                <h4>Anti-Tarnish Guarantee</h4>
                <p>Digital certificate for 18k real gold vacuum PVD pieces.</p>
              </div>
            </div>
            <div className="auth-benefit-item">
              <Truck size={20} className="benefit-icon" />
              <div>
                <h4>Express Dispatch Tracking</h4>
                <p>Track Bluedart Express shipments with real-time milestones.</p>
              </div>
            </div>
            <div className="auth-benefit-item">
              <Tag size={20} className="benefit-icon" />
              <div>
                <h4>Privilege Tier Vouchers</h4>
                <p>₹200 welcome gift & member savings automatically applied.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Google Account Modal */}
        {showCustomModal && (
          <div className="modal-backdrop" onClick={() => setShowCustomModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <GoogleIcon />
                <h3>Sign in with Google</h3>
              </div>
              <p className="modal-desc">
                Enter your Google account details to sign into Satvastones Atelier.
              </p>
              <form onSubmit={handleCustomGoogleSignIn} className="modal-form">
                <div className="form-group">
                  <label htmlFor="custom-email">Google Email Address *</label>
                  <input
                    id="custom-email"
                    type="email"
                    required
                    placeholder="you@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="custom-name">Full Name</label>
                  <input
                    id="custom-name"
                    type="text"
                    placeholder="Your Full Name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCustomModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Verify & Continue
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Authenticated View (User is signed in)
  const activeVouchers = (vouchers || []).filter((v) => v.active !== false);

  return (
    <div className="container account-page-wrapper">
      {/* Client Overview Card */}
      <header className="account-hero-bar">
        <div className="client-identity">
          <div className="client-google-badge">
            <GoogleIcon />
            <span>Google Verified Account</span>
          </div>
          <h1 className="client-name">{currentUser.name || "Valued Client"}</h1>
          <p className="client-meta">
            {currentUser.email} • Member since {currentUser.joinedDate || "2026"} • {userOrders.length} orders
          </p>
        </div>

        <div className="client-perks-box">
          <div className="perk-stat">
            <span className="stat-num">{activeVouchers.length}</span>
            <span className="stat-desc">Active vouchers</span>
          </div>
          <div className="perk-stat">
            <span className="stat-num">Lifetime</span>
            <span className="stat-desc">PVD Anti-Tarnish Cover</span>
          </div>
          <button
            type="button"
            className="signout-link-btn"
            onClick={signOut}
            title="Sign out of your account"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Account Navigation Tabs */}
      <div className="account-tab-row" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'orders'}
          className={`account-tab-btn ${activeTab === 'orders' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <Package size={16} /> Orders & Live Tracking ({userOrders.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'addresses'}
          className={`account-tab-btn ${activeTab === 'addresses' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('addresses')}
        >
          <MapPin size={16} /> Saved Delivery Address
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'vouchers'}
          className={`account-tab-btn ${activeTab === 'vouchers' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('vouchers')}
        >
          <Tag size={16} /> Privilege Vouchers ({activeVouchers.length})
        </button>
      </div>

      {/* Tab 1: Orders & Live Tracking */}
      {activeTab === 'orders' && (
        <section className="orders-panel-content">
          {userOrders.length === 0 ? (
            <div className="client-order-card empty-orders-card">
              <Package size={36} className="empty-icon" />
              <h3>No orders recorded yet</h3>
              <p>Explore our shower-safe 18k gold vacuum PVD collection to place your first order.</p>
              <Link href="/anti-tarnish-jewellery" className="btn btn-primary">
                Discover Anti-Tarnish Collection
              </Link>
            </div>
          ) : (
            userOrders.map((order) => (
              <div key={order.orderId} className="client-order-card">
                <div className="order-card-header">
                  <div className="order-identifiers">
                    <span className="order-id-code">{order.orderId}</span>
                    <span className="order-date-text">Placed on {order.date}</span>
                  </div>
                  <div className="order-status-indicator">
                    <Truck size={14} />
                    <span>{order.status || 'Confirmed'}</span>
                  </div>
                </div>

                {/* Progress Tracker */}
                <div className="order-live-tracker">
                  <div className="tracker-steps-line">
                    <div className="step-point is-complete">
                      <span className="step-dot"><CheckCircle2 size={12} /></span>
                      <span className="step-label">Confirmed</span>
                    </div>
                    <div className={`step-point ${order.status !== 'Confirmed' ? 'is-complete' : ''}`}>
                      <span className="step-dot"><CheckCircle2 size={12} /></span>
                      <span className="step-label">Packed</span>
                    </div>
                    <div className={`step-point ${order.status === 'In Transit' || order.status === 'Out for delivery' || order.status === 'Delivered' ? 'is-complete' : ''}`}>
                      <span className="step-dot"><CheckCircle2 size={12} /></span>
                      <span className="step-label">In Transit ({order.carrier || 'Bluedart'})</span>
                    </div>
                    <div className={`step-point ${order.status === 'Delivered' ? 'is-complete' : ''}`}>
                      <span className="step-dot"><CheckCircle2 size={12} /></span>
                      <span className="step-label">Delivered</span>
                    </div>
                  </div>
                  {order.trackingNumber && (
                    <div className="order-tracking-meta">
                      <span>Airway Bill: <strong>{order.trackingNumber}</strong></span>
                      <span>Carrier: <strong>{order.carrier || 'Bluedart Express'}</strong></span>
                      {order.destination && <span>Destination: <strong>{order.destination}</strong></span>}
                    </div>
                  )}
                </div>

                {/* Items List in Order */}
                <div className="order-items-sublist">
                  {order.items?.map((it, i) => {
                    const qty = it.quantity || it.qty || 1;
                    return (
                      <div key={i} className="order-subitem-row">
                        <div className="subitem-info">
                          <span className="subitem-title">{it.title}</span>
                          <span className="subitem-meta">Qty: {qty} • Finish: {it.finish || '18K Gold'}</span>
                        </div>
                        <span className="subitem-cost">₹{it.price * qty}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="order-card-footer">
                  <div className="order-total-block">
                    <span className="total-label">Settlement ({order.paymentMethod || 'Prepaid UPI'}):</span>
                    <span className="total-val">₹{order.total}</span>
                  </div>
                  <div className="order-actions-buttons">
                    <button
                      type="button"
                      className="btn btn-secondary order-mini-btn"
                      onClick={() => alert(`Invoice generated for order ${order.orderId}. Sent to ${currentUser.email}.`)}
                    >
                      Download Tax Invoice
                    </button>
                    <Link href="/anti-tarnish-jewellery" className="btn btn-primary order-mini-btn">
                      Reorder pieces
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {/* Tab 2: Saved Delivery Address */}
      {activeTab === 'addresses' && (
        <section className="addresses-panel-content">
          {!isEditingAddress ? (
            <div className="address-card default-address">
              <div className="address-card-head">
                <span className="default-address-tag">Default Shipping Address</span>
                <button
                  type="button"
                  className="edit-addr-btn"
                  onClick={() => {
                    setAddrForm(currentUser.addresses?.[0] || defaultAddr);
                    setIsEditingAddress(true);
                  }}
                >
                  <Edit2 size={14} /> Edit Address
                </button>
              </div>

              {currentUser.addresses && currentUser.addresses.length > 0 ? (
                <>
                  <h4 className="address-recipient">{currentUser.addresses[0].fullName || currentUser.name}</h4>
                  <p className="address-lines">
                    {currentUser.addresses[0].address}<br />
                    {currentUser.addresses[0].landmark && <>{currentUser.addresses[0].landmark}<br /></>}
                    {currentUser.addresses[0].city}, {currentUser.addresses[0].state} ({currentUser.addresses[0].pincode})<br />
                    Phone: {currentUser.addresses[0].phone || '+91 98765 43210'}
                  </p>
                </>
              ) : (
                <div className="empty-address-box">
                  <p>No delivery address saved yet.</p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setIsEditingAddress(true)}
                  >
                    <Plus size={14} /> Add Delivery Address
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="address-card edit-address-card">
              <h3 className="edit-addr-title">Update Delivery Address</h3>
              <form onSubmit={handleSaveAddress} className="edit-addr-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Recipient Name *</label>
                    <input
                      type="text"
                      required
                      value={addrForm.fullName}
                      onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={addrForm.phone}
                      onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Street Address / Flat / Building *</label>
                  <input
                    type="text"
                    required
                    value={addrForm.address}
                    onChange={(e) => setAddrForm({ ...addrForm, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Landmark (Optional)</label>
                  <input
                    type="text"
                    value={addrForm.landmark || ''}
                    onChange={(e) => setAddrForm({ ...addrForm, landmark: e.target.value })}
                  />
                </div>

                <div className="form-row three-cols">
                  <div className="form-group">
                    <label>City *</label>
                    <input
                      type="text"
                      required
                      value={addrForm.city}
                      onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>State *</label>
                    <input
                      type="text"
                      required
                      value={addrForm.state}
                      onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Pincode *</label>
                    <input
                      type="text"
                      required
                      pattern="[0-9]{6}"
                      value={addrForm.pincode}
                      onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value })}
                    />
                  </div>
                </div>

                <div className="edit-addr-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsEditingAddress(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      )}

      {/* Tab 3: Dynamic Privilege Vouchers (Admin Controlled) */}
      {activeTab === 'vouchers' && (
        <section className="vouchers-panel-content">
          <div className="vouchers-intro-banner">
            <div>
              <h3>Active Satva Privileges</h3>
              <p>Exclusive voucher codes unlocked for your Google verified profile. Controlled dynamically via our atelier engine.</p>
            </div>
          </div>

          <div className="vouchers-card-grid">
            {activeVouchers.map((voucher) => (
              <div key={voucher.code} className="voucher-tile-card">
                <div className="voucher-tile-header">
                  <span className="voucher-code-label">{voucher.code}</span>
                  <span className="voucher-expiry">{voucher.expiry || 'Valid in 2026'}</span>
                </div>
                <h4 className="voucher-heading">
                  {voucher.type === 'fixed' ? `₹${voucher.value} off your order` : `${voucher.value}% off your order`}
                </h4>
                <p className="voucher-terms">{voucher.description}</p>
                <div className="voucher-card-footer">
                  <span className="voucher-min-tag">
                    {voucher.minOrder > 0 ? `Min. bag value ₹${voucher.minOrder}` : 'No minimum order'}
                  </span>
                  <button
                    type="button"
                    className={`copy-code-btn ${copiedCode === voucher.code ? 'is-copied' : ''}`}
                    onClick={() => handleCopyVoucher(voucher.code)}
                  >
                    {copiedCode === voucher.code ? (
                      <>
                        <Check size={14} /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copy Code
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
