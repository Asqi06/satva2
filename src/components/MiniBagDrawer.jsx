'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Trash2, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './MiniBagDrawer.css';

const QUICK_UPSELLS = [
  {
    id: 901,
    title: "Microfiber Care & Polishing Cloth",
    price: 99,
    mrp: 299,
    subcategory: "Care Essential",
    imageBg: "linear-gradient(135deg, #f3ede2 0%, #e8dcce 100%)",
  },
  {
    id: 501,
    title: "Classic Gold Plated Daily Hoops (25mm)",
    price: 249,
    mrp: 599,
    subcategory: "Earrings",
    imageBg: "linear-gradient(135deg, #f9f2e7 0%, #e6d3ba 100%)",
  },
];

export default function MiniBagDrawer() {
  const {
    cart,
    itemCount,
    subtotal,
    isFreeShipping,
    amountToFreeShipping,
    freeShippingThreshold,
    isMiniBagOpen,
    closeMiniBag,
    updateQuantity,
    removeFromCart,
    addToCart,
    grandTotal,
    totalSavings,
  } = useCart();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMiniBagOpen) {
        closeMiniBag();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMiniBagOpen, closeMiniBag]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isMiniBagOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMiniBagOpen]);

  if (!isMiniBagOpen) return null;

  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <div className="mini-bag-backdrop" onClick={closeMiniBag} role="dialog" aria-modal="true" aria-label="Shopping Bag Drawer">
      <aside className="mini-bag-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <Image
              src="/logo.png"
              alt="Satvastones"
              width={125}
              height={38}
              className="drawer-brand-logo"
            />
            <h3 className="drawer-headline">Your Shopping Bag ({itemCount})</h3>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={closeMiniBag}
            aria-label="Close shopping bag"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="drawer-progress-container">
          <div className="drawer-progress-text">
            {isFreeShipping ? (
              <span className="free-shipping-unlocked">
                <Check size={14} strokeWidth={2} className="inline-icon" />
                Complimentary Express Shipping Unlocked
              </span>
            ) : (
              <span>
                Add <strong>₹{amountToFreeShipping}</strong> more to qualify for Free Express Shipping
              </span>
            )}
          </div>
          <div className="drawer-progress-track">
            <div
              className="drawer-progress-bar"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="drawer-items-scroll">
          {cart.length === 0 ? (
            <div className="drawer-empty-state">
              <p className="empty-bag-text">Your shopping bag is currently empty.</p>
              <Link
                href="/anti-tarnish-jewellery"
                className="btn btn-secondary drawer-browse-btn"
                onClick={closeMiniBag}
              >
                Explore Anti-Tarnish Bestsellers
              </Link>
            </div>
          ) : (
            cart.map((item) => (
              <div key={`${item.id}-${item.finish}`} className="drawer-cart-item">
                <div
                  className="drawer-item-thumb"
                  style={{ background: item.imageBg || "var(--canvas-subtle)", position: 'relative', overflow: 'hidden' }}
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="60px"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <span className="drawer-thumb-sub">{item.subcategory || 'Jewellery'}</span>
                  )}
                </div>

                <div className="drawer-item-info">
                  <h4 className="drawer-item-title">{item.title}</h4>
                  <div className="drawer-item-meta">
                    <span className="drawer-item-finish">{item.finish}</span>
                    <span className="drawer-item-price">₹{item.price}</span>
                    {item.mrp && <span className="drawer-item-mrp">₹{item.mrp}</span>}
                  </div>

                  <div className="drawer-item-actions">
                    <div className="drawer-stepper">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="drawer-step-btn"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="drawer-step-qty">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="drawer-step-btn"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="drawer-remove-btn"
                      aria-label="Remove item"
                    >
                      <Trash2 size={15} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Quick 1-Click Upsells */}
          {cart.length > 0 && (
            <div className="drawer-upsells-section">
              <span className="drawer-upsells-heading">Complete with Care Essentials</span>
              <div className="drawer-upsells-list">
                {QUICK_UPSELLS.filter((up) => !cart.some((c) => c.id === up.id)).map((upsell) => (
                  <div key={upsell.id} className="drawer-upsell-card">
                    <div className="upsell-details">
                      <span className="upsell-title">{upsell.title}</span>
                      <div className="upsell-pricing">
                        <span className="upsell-price">₹{upsell.price}</span>
                        <span className="upsell-mrp">₹{upsell.mrp}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="drawer-upsell-add-btn"
                      onClick={() => addToCart(upsell, 1, { openDrawer: false })}
                    >
                      + Add (₹{upsell.price})
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer & Checkout Action */}
        {cart.length > 0 && (
          <div className="drawer-footer">
            <div className="drawer-summary-line">
              <span className="summary-label">Bag Subtotal</span>
              <span className="summary-val">₹{subtotal}</span>
            </div>
            {totalSavings > 0 && (
              <div className="drawer-summary-line savings-line">
                <span className="summary-label">Atelier Savings</span>
                <span className="summary-val">-₹{totalSavings}</span>
              </div>
            )}
            <div className="drawer-summary-line total-line">
              <span className="summary-label">Estimated Total</span>
              <span className="summary-val">₹{grandTotal}</span>
            </div>

            <p className="drawer-tax-note">Taxes included. Cash on Delivery available at checkout.</p>

            <div className="drawer-action-stack">
              <Link
                href="/checkout"
                className="btn btn-primary drawer-checkout-btn"
                onClick={closeMiniBag}
              >
                Proceed to Checkout
                <ArrowRight size={16} strokeWidth={1.5} />
              </Link>
              <Link
                href="/cart"
                className="btn btn-outline drawer-view-cart-btn"
                onClick={closeMiniBag}
              >
                View Full Bag & Apply Privileges
              </Link>
            </div>

            <div className="drawer-trust-badge">
              <ShieldCheck size={14} strokeWidth={1.5} />
              <span>18K PVD Anti-Tarnish Guarantee | 7-Day Exchange</span>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
