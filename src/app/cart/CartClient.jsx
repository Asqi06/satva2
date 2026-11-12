'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import './page.css';

const cartUpsells = [
  {
    id: 901,
    title: "Microfiber Jewelry Polishing & Care Cloth",
    price: 99,
    mrp: 299,
    category: "Care Essential",
    subcategory: "Care Essential",
  },
  {
    id: 501,
    title: "Classic Gold Plated Daily Hoop Earrings (25mm)",
    price: 249,
    mrp: 599,
    category: "anti-tarnish",
    subcategory: "Earrings",
  },
];

export default function CartClient() {
  const {
    cart,
    subtotal,
    freeShippingThreshold,
    isFreeShipping,
    amountToFreeShipping,
    shippingCost,
    appliedVoucher,
    voucherDiscount,
    voucherError,
    grandTotal,
    updateQuantity,
    removeFromCart,
    addToCart,
    applyVoucher,
    removeVoucher,
  } = useCart();

  const [inputCode, setInputCode] = useState('');

  const handleVoucherSubmit = (e) => {
    e.preventDefault();
    if (inputCode.trim()) {
      applyVoucher(inputCode.trim());
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container cart-empty-view">
        <h1 className="cart-page-title">Your shopping bag is empty</h1>
        <p className="cart-empty-lead">
          Explore our anti-tarnish collection, engineered in 316L surgical steel and 18k real gold.
        </p>
        <Link href="/anti-tarnish-jewellery" className="btn btn-primary">
          Explore collection
        </Link>
      </div>
    );
  }

  return (
    <div className="container cart-page-layout">
      <h1 className="cart-page-title">Shopping Bag ({cart.length})</h1>

      {/* AOV Booster 1: Free Shipping & Velvet Pouch Progress Bar */}
      <div className="cart-progress-card">
        {isFreeShipping ? (
          <div className="progress-unlocked-row">
            <span className="unlocked-text">✓ You unlocked complimentary express shipping & microfiber travel pouch</span>
          </div>
        ) : (
          <div className="progress-pending-row">
            <span>Add <strong>₹{amountToFreeShipping}</strong> more to qualify for complimentary express delivery</span>
          </div>
        )}
        <div className="progress-track" aria-hidden="true">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
          />
        </div>
      </div>

      <div className="cart-content-grid">
        {/* Left: Items List */}
        <div className="cart-items-column">
          <ul className="cart-items-list" aria-label="Items in bag">
            {cart.map((item) => (
              <li key={`${item.id}-${item.finish}`} className="cart-item-row">
                <div className="item-thumbnail" style={{ background: item.imageBg || "var(--canvas-subtle)", position: 'relative', overflow: 'hidden' }}>
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="80px"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <span>{item.subcategory || item.finish}</span>
                  )}
                </div>

                <div className="item-description-block">
                  <h3 className="item-title">
                    <Link href={`/products/${item.slug || item.id}`}>{item.title}</Link>
                  </h3>
                  <span className="item-finish-meta">Finish: {item.finish}</span>
                  <div className="item-prices-display">
                    <span className="item-active-price">₹{item.price}</span>
                    {item.mrp > item.price && <span className="item-mrp-strike">₹{item.mrp}</span>}
                  </div>
                </div>

                <div className="item-stepper-control">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, -1)}
                    aria-label={`Decrease quantity for ${item.title}`}
                  >
                    -
                  </button>
                  <span className="stepper-count">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, 1)}
                    aria-label={`Increase quantity for ${item.title}`}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className="item-remove-trigger"
                  onClick={() => removeFromCart(item.id)}
                  aria-label={`Remove ${item.title} from bag`}
                >
                  <Trash2 size={16} strokeWidth={1.5} />
                </button>
              </li>
            ))}
          </ul>

          {/* AOV Booster 2: In-Cart One-Click Addons */}
          <div className="cart-upsell-module">
            <h4 className="upsell-heading">Frequently added essentials</h4>
            <div className="upsell-items-list">
              {cartUpsells.map((upsell) => {
                const isAdded = cart.some((c) => c.id === upsell.id);
                return (
                  <div key={upsell.id} className="upsell-row">
                    <div className="upsell-info">
                      <span className="upsell-title">{upsell.title}</span>
                      <div className="upsell-pricing">
                        <span className="upsell-price">₹{upsell.price}</span>
                        <span className="upsell-mrp">₹{upsell.mrp}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`upsell-action-btn ${isAdded ? 'is-added' : ''}`}
                      onClick={() => !isAdded && addToCart(upsell, 1, { openDrawer: false })}
                      disabled={isAdded}
                    >
                      {isAdded ? 'Added' : `+ Add for ₹${upsell.price}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Order Summary Sidebar */}
        <aside className="cart-summary-sidebar" aria-label="Order summary">
          <div className="summary-card-frame">
            <h3 className="summary-card-heading">Order summary</h3>

            {/* Voucher Code Form */}
            <form onSubmit={handleVoucherSubmit} className="voucher-form-block">
              <div className="voucher-input-row">
                <input
                  type="text"
                  placeholder="Voucher or code"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  aria-label="Voucher code"
                />
                <button type="submit" className="voucher-apply-action">
                  Apply
                </button>
              </div>
              {voucherError && <span className="voucher-feedback-error">{voucherError}</span>}
              {appliedVoucher && (
                <div className="voucher-success-row">
                  <span className="voucher-feedback-success">
                    {appliedVoucher.code} ({appliedVoucher.label}) applied
                  </span>
                  <button type="button" onClick={removeVoucher} className="voucher-remove-btn">
                    Remove
                  </button>
                </div>
              )}
            </form>

            {/* Suggested Vouchers */}
            <div className="voucher-suggestions">
              <span className="suggestions-label">Available privileges:</span>
              <button
                type="button"
                className="voucher-pill"
                onClick={() => {
                  setInputCode('SATVA200');
                  applyVoucher('SATVA200');
                }}
              >
                SATVA200 (₹200 off ₹499+)
              </button>
            </div>

            {/* Calculation Lines */}
            <div className="summary-lines-table">
              <div className="summary-line">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              {voucherDiscount > 0 && (
                <div className="summary-line discount-line">
                  <span>Privilege ({appliedVoucher?.code})</span>
                  <span>-₹{voucherDiscount}</span>
                </div>
              )}
              <div className="summary-line">
                <span>Express Shipping</span>
                <span>{shippingCost === 0 ? 'Complimentary' : `₹${shippingCost}`}</span>
              </div>
              <div className="summary-line total-line">
                <span>Total amount</span>
                <span className="grand-total-price">₹{grandTotal}</span>
              </div>
            </div>

            <Link href="/checkout" className="btn btn-primary checkout-primary-link">
              Proceed to checkout <ArrowRight size={15} style={{ marginLeft: 6 }} />
            </Link>

            <div className="summary-guarantee-note">
              <p>✓ 18k vacuum PVD waterproof guarantee</p>
              <p>✓ Doorstep cash on delivery accepted</p>
              <p>✓ 7-day hassle-free exchange policy</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
