'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, Shield, Droplets, Feather, Truck, RotateCcw, Plus, Check, ChevronDown, MapPin } from 'lucide-react';
import ProductCard from '../../../components/ProductCard';
import { useCart } from '../../../context/CartContext';
import './page.css';

export default function ProductDetailClient({ product, relatedProducts = [] }) {
  const router = useRouter();
  const { addToCart, toggleWishlist, isWishlisted } = useCart();
  const [selectedFinish, setSelectedFinish] = useState(product.colors?.[0] || '#D4AF37');
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [activeView, setActiveView] = useState('studio');
  const [quantity, setQuantity] = useState(1);
  const [hasAdded, setHasAdded] = useState(false);
  const [pairAdded, setPairAdded] = useState(false);
  const [pincode, setPincode] = useState('');
  const [deliveryEstimate, setDeliveryEstimate] = useState(null);

  // Accordion state
  const [openSection, setOpenSection] = useState('specifications');

  const isSaved = isWishlisted(product.id);
  const savings = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const pairedItem = relatedProducts[0] || null;
  const comboPrice = pairedItem ? product.price + pairedItem.price - 100 : 0;
  const comboOriginal = pairedItem ? product.mrp + pairedItem.mrp : 0;

  const productImages = product.images && product.images.length > 0
    ? product.images.map(img => img.secureUrl || img.url || '').filter(Boolean)
    : (product.image ? [product.image] : []);

  const activeImageUrl = productImages[selectedImageIdx] || product.image || '';

  const handlePincodeCheck = (e) => {
    e.preventDefault();
    if (pincode.length === 6) {
      setDeliveryEstimate("Estimated delivery in 2-4 business days via Bluedart Express");
    } else {
      setDeliveryEstimate("Please enter a valid 6-digit Indian pincode");
    }
  };

  const handleAddMain = () => {
    addToCart(
      {
        id: product.id,
        title: product.title,
        price: product.price,
        mrp: product.mrp,
        finish: selectedFinish === '#C0C0C0' ? 'Polished Silver' : '18K Gold',
        imageBg: product.imageBg,
        image: activeImageUrl,
        subcategory: product.subcategory,
        category: product.category,
      },
      quantity
    );
    setHasAdded(true);
    setTimeout(() => setHasAdded(false), 2400);
  };

  const handleInstantCod = (e) => {
    e.preventDefault();
    addToCart(
      {
        id: product.id,
        title: product.title,
        price: product.price,
        mrp: product.mrp,
        finish: selectedFinish === '#C0C0C0' ? 'Polished Silver' : '18K Gold',
        imageBg: product.imageBg,
        image: activeImageUrl,
        subcategory: product.subcategory,
        category: product.category,
      },
      quantity,
      { openDrawer: false }
    );
    router.push('/checkout');
  };

  const handleAddPair = () => {
    if (!pairedItem) return;
    addToCart(
      {
        id: product.id,
        title: product.title,
        price: product.price,
        mrp: product.mrp,
        finish: selectedFinish === '#C0C0C0' ? 'Polished Silver' : '18K Gold',
        imageBg: product.imageBg,
        subcategory: product.subcategory,
        category: product.category,
      },
      1,
      { openDrawer: false }
    );

    addToCart(
      {
        id: pairedItem.id,
        title: pairedItem.title,
        price: pairedItem.price - 100,
        mrp: pairedItem.mrp,
        finish: '18K Gold',
        imageBg: pairedItem.imageBg,
        subcategory: pairedItem.subcategory,
        category: pairedItem.category,
      },
      1,
      { openDrawer: true }
    );

    setPairAdded(true);
    setTimeout(() => setPairAdded(false), 2400);
  };

  const toggleAccordion = (name) => {
    setOpenSection(openSection === name ? null : name);
  };

  return (
    <article className="pdp-container container">
      {/* Breadcrumb Hierarchy */}
      <nav className="pdp-breadcrumbs" aria-label="Breadcrumbs">
        <Link href="/">Home</Link>
        <span className="crumb-divider">/</span>
        <Link href={`/${product.category}-jewellery`}>
          {product.category?.charAt(0).toUpperCase() + product.category?.slice(1)}
        </Link>
        <span className="crumb-divider">/</span>
        <span className="current-crumb">{product.title}</span>
      </nav>

      <div className="pdp-main-grid">
        {/* Left Column: Visual Gallery Stage */}
        <div className="pdp-gallery-col">
          <div
            className="pdp-primary-stage"
            style={{
              background: activeView === 'model' && product.secondaryBg ? product.secondaryBg : product.imageBg,
            }}
          >
            {product.badge && (
              <span className="pdp-status-badge">
                {product.badge.toLowerCase().includes('bestseller') ? 'Bestseller' : product.badge}
              </span>
            )}

            <button
              type="button"
              className={`pdp-wishlist-action ${isSaved ? 'is-active' : ''}`}
              onClick={() => toggleWishlist(product.id)}
              aria-label={isSaved ? "Remove from saved items" : "Save item"}
            >
              <Heart size={18} fill={isSaved ? "var(--crimson)" : "none"} strokeWidth={1.5} />
            </button>

            {activeImageUrl ? (
              <div className="pdp-real-image-container">
                <Image
                  src={activeImageUrl}
                  alt={`${product.title} - 18K Gold Plated Demi-Fine Jewellery`}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="pdp-featured-img"
                />
              </div>
            ) : (
              <div className="pdp-stage-silhouette">
                <span className="pdp-stage-view-label">
                  {activeView === 'studio' && "Studio view"}
                  {activeView === 'model' && "Styled on model"}
                  {activeView === 'macro' && "18k vacuum PVD detail"}
                </span>
                <span className="pdp-stage-metal">{product.material}</span>
              </div>
            )}
          </div>

          {/* Thumbnail Selectors */}
          <div className="pdp-thumbnails-strip" role="tablist">
            {productImages.length > 1 ? (
              productImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`thumb-button ${selectedImageIdx === idx ? 'is-active' : ''}`}
                  onClick={() => setSelectedImageIdx(idx)}
                >
                  View {idx + 1}
                </button>
              ))
            ) : (
              <>
                <button
                  type="button"
                  className={`thumb-button ${activeView === 'studio' ? 'is-active' : ''}`}
                  onClick={() => setActiveView('studio')}
                >
                  Studio
                </button>
                <button
                  type="button"
                  className={`thumb-button ${activeView === 'model' ? 'is-active' : ''}`}
                  onClick={() => setActiveView('model')}
                >
                  On Model
                </button>
                <button
                  type="button"
                  className={`thumb-button ${activeView === 'macro' ? 'is-active' : ''}`}
                  onClick={() => setActiveView('macro')}
                >
                  Craft Detail
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Specification & Purchasing Area */}
        <div className="pdp-order-col">
          <span className="pdp-brand-marker">Satvastones Atelier</span>
          <h1 className="pdp-title-heading">{product.title}</h1>

          {/* Pricing Row */}
          <div className="pdp-price-band">
            <span className="pdp-current-price">₹{product.price}</span>
            <span className="pdp-mrp-strike">₹{product.mrp}</span>
            <span className="pdp-savings-callout">Save {savings}%</span>
            <span className="pdp-tax-notice">Taxes included</span>
          </div>

          <p className="pdp-summary-description">{product.description}</p>

          {/* Finish / Color Selector */}
          {product.colors && product.colors.length > 0 && (
            <div className="pdp-option-section">
              <span className="option-label-heading">
                Finish: <strong>{selectedFinish === '#D4AF37' ? '18K Gold' : selectedFinish === '#C0C0C0' ? 'Silver' : 'Rose Gold'}</strong>
              </span>
              <div className="finish-discs-row">
                {product.colors.map((c, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`finish-disc-item ${selectedFinish === c ? 'is-active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setSelectedFinish(c)}
                    aria-label={`Select ${c === '#D4AF37' ? '18k gold' : c === '#C0C0C0' ? 'silver' : 'rose gold'} finish`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector & Add to Bag Action */}
          <div className="pdp-actions-row">
            <div className="quantity-stepper" aria-label="Select quantity">
              <button
                type="button"
                className="step-btn"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="quantity-readout">{quantity}</span>
              <button
                type="button"
                className="step-btn"
                onClick={() => setQuantity(quantity + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              type="button"
              className={`pdp-primary-add-button ${hasAdded ? 'has-confirmed' : ''}`}
              onClick={handleAddMain}
            >
              {hasAdded ? 'Added to bag' : `Add to bag (₹${product.price * quantity})`}
            </button>
          </div>

          <button
            type="button"
            className="pdp-instant-cod-action"
            onClick={handleInstantCod}
          >
            Buy with Cash on Delivery
          </button>

          {/* Pincode Estimator */}
          <div className="pdp-delivery-checker">
            <form onSubmit={handlePincodeCheck} className="checker-form">
              <MapPin size={16} className="pin-icon" aria-hidden="true" />
              <input
                type="text"
                placeholder="Enter 6-digit delivery pincode"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                aria-label="Delivery pincode"
              />
              <button type="submit" className="checker-submit">
                Check
              </button>
            </form>
            {deliveryEstimate && <p className="delivery-result-text">{deliveryEstimate}</p>}
          </div>

          {/* AOV BOOSTER: Frequently Styled Together Bundle */}
          {pairedItem && (
            <div className="frequently-paired-card">
              <span className="paired-kicker">The Layering Recommendation</span>
              <h4 className="paired-title">Frequently styled together</h4>
              <div className="paired-product-row">
                <div className="paired-thumb" style={{ background: pairedItem.imageBg }}>
                  <span>{pairedItem.subcategory}</span>
                </div>
                <div className="paired-info">
                  <span className="paired-name">{pairedItem.title}</span>
                  <span className="paired-prices">
                    ₹{pairedItem.price} <span className="strike">₹{pairedItem.mrp}</span>
                  </span>
                </div>
              </div>

              <div className="paired-action-footer">
                <div className="paired-combined-pricing">
                  <span className="combo-price-text">Bundle: ₹{comboPrice}</span>
                  <span className="combo-mrp-strike">₹{comboOriginal}</span>
                  <span className="combo-savings-pill">Save extra ₹100</span>
                </div>
                <button
                  type="button"
                  className={`paired-bundle-add-btn ${pairAdded ? 'has-added' : ''}`}
                  onClick={handleAddPair}
                >
                  {pairAdded ? 'Both added to bag' : 'Add both to bag'}
                </button>
              </div>
            </div>
          )}

          {/* Informational Accordions */}
          <div className="pdp-accordions-group">
            <div className="accordion-cell">
              <button
                type="button"
                className="accordion-header-btn"
                onClick={() => toggleAccordion('specifications')}
                aria-expanded={openSection === 'specifications'}
              >
                <span>Material specifications & dimensions</span>
                <ChevronDown size={16} className={`accordion-icon ${openSection === 'specifications' ? 'is-rotated' : ''}`} />
              </button>
              {openSection === 'specifications' && (
                <div className="accordion-body-text">
                  <p><strong>Base metal:</strong> 316L medical-grade stainless steel</p>
                  <p><strong>Finishing:</strong> 18k real gold vacuum physical vapour deposition (PVD)</p>
                  <p><strong>Chain length:</strong> 40 cm with 5 cm adjustable extension</p>
                  <p><strong>Skin test:</strong> 100% hypoallergenic, nickel-free, cadmium-free</p>
                </div>
              )}
            </div>

            <div className="accordion-cell">
              <button
                type="button"
                className="accordion-header-btn"
                onClick={() => toggleAccordion('waterproof')}
                aria-expanded={openSection === 'waterproof'}
              >
                <span>Waterproof & shower guarantee</span>
                <ChevronDown size={16} className={`accordion-icon ${openSection === 'waterproof' ? 'is-rotated' : ''}`} />
              </button>
              {openSection === 'waterproof' && (
                <div className="accordion-body-text">
                  <p>
                    All Satvastones pieces are engineered for continuous wear. You can safely wear this piece in the shower, pool, and during workouts. It will not tarnish, flake, or turn your skin green.
                  </p>
                </div>
              )}
            </div>

            <div className="accordion-cell">
              <button
                type="button"
                className="accordion-header-btn"
                onClick={() => toggleAccordion('shipping')}
                aria-expanded={openSection === 'shipping'}
              >
                <span>Dispatch, COD & 7-day returns</span>
                <ChevronDown size={16} className={`accordion-icon ${openSection === 'shipping' ? 'is-rotated' : ''}`} />
              </button>
              {openSection === 'shipping' && (
                <div className="accordion-body-text">
                  <p>
                    Dispatched from our Mumbai atelier within 24 hours. Complimentary express delivery across India on orders above ₹499. Cash on delivery is accepted at your doorstep with 7-day easy returns.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <section className="pdp-related-section">
          <div className="section-title-split">
            <div>
              <span className="editorial-kicker">Harmonious pieces</span>
              <h2>Complementary designs</h2>
            </div>
          </div>
          <div className="home-products-grid">
            {relatedProducts.slice(0, 4).map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </section>
      )}

      {/* Floating Mobile Sticky Bar */}
      <aside className="sticky-mobile-pdp-bar hide-on-desktop" aria-label="Quick order bar">
        <div className="mobile-bar-info">
          <span className="mobile-bar-title">{product.title}</span>
          <span className="mobile-bar-price">₹{product.price}</span>
        </div>
        <button
          type="button"
          className="mobile-bar-action"
          onClick={handleAddMain}
        >
          {hasAdded ? 'Added' : 'Add to bag'}
        </button>
      </aside>
    </article>
  );
}
