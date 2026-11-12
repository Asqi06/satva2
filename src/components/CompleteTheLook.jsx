'use client';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { curatedBundles as defaultBundles, getProductById } from '../data/products';
import { useCart } from '../context/CartContext';
import './CompleteTheLook.css';

export default function CompleteTheLook({ liveProducts = [] }) {
  const { addBundleToCart } = useCart();
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [hasAdded, setHasAdded] = useState(false);

  // Build dynamic real-product bundles when database products are available
  const bundles = useMemo(() => {
    if (liveProducts && liveProducts.length >= 3) {
      const necklaces = liveProducts.filter((p) => p.subcategory === 'necklaces' || p.category === 'anti-tarnish' || p.title.toLowerCase().includes('pendant') || p.title.toLowerCase().includes('necklace'));
      const earrings = liveProducts.filter((p) => p.subcategory === 'earrings' || p.title.toLowerCase().includes('earring') || p.title.toLowerCase().includes('jhumka') || p.title.toLowerCase().includes('hoop'));
      const rings = liveProducts.filter((p) => p.subcategory === 'rings' || p.subcategory === 'bracelets' || p.title.toLowerCase().includes('ring') || p.title.toLowerCase().includes('bangle') || p.title.toLowerCase().includes('bracelet'));

      const makeUniqueSet = (preferredNecklace, preferredEarring, preferredRing) => {
        const set = [];
        const seenIds = new Set();

        const pick = (list) => {
          for (const item of list) {
            if (item && !seenIds.has(item.id)) {
              seenIds.add(item.id);
              set.push(item);
              return;
            }
          }
        };

        pick([preferredNecklace, ...necklaces, ...liveProducts]);
        pick([preferredEarring, ...earrings, ...liveProducts]);
        pick([preferredRing, ...rings, ...liveProducts]);

        return set;
      };

      const set1Items = makeUniqueSet(necklaces[0], earrings[0], rings[0]);
      const set2Items = makeUniqueSet(necklaces[1], earrings[1], rings[1]);
      const set3Items = makeUniqueSet(necklaces[2], earrings[2], rings[2]);

      const makeBundle = (id, title, tagline, items, savingsPercent = 30) => {
        const totalMrp = items.reduce((sum, item) => sum + (item.mrp || item.price * 2), 0);
        const rawPrice = items.reduce((sum, item) => sum + item.price, 0);
        const bundlePrice = Math.round(rawPrice * (1 - savingsPercent / 100));
        return {
          id,
          title,
          tagline,
          items,
          bundlePrice,
          totalMrp,
          savingsPercent,
        };
      };

      return [
        makeBundle('bundle-live-1', 'The Daily Signature Trio', 'Anti-Tarnish Necklace, Drop Earrings & Ring', set1Items, 30),
        makeBundle('bundle-live-2', 'The Seoul Aesthetic Edit', 'Curated Freshwater Pearl & Minimalist Set', set2Items, 35),
        makeBundle('bundle-live-3', 'The Stacking Essentials', 'Layered Chains & Everyday Adjustable Band', set3Items, 25),
      ];
    }

    return defaultBundles.map((b) => ({
      ...b,
      items: b.productIds.map((id) => getProductById(id)).filter(Boolean),
    }));
  }, [liveProducts]);

  const activeBundle = bundles[activeSetIndex] || bundles[0];
  const items = activeBundle?.items || [];

  const handleAddBundle = () => {
    if (!activeBundle || items.length === 0) return;
    addBundleToCart(items, activeBundle.title);
    setHasAdded(true);
    setTimeout(() => setHasAdded(false), 2200);
  };

  if (!activeBundle || items.length === 0) return null;

  return (
    <section className="curated-sets-section" aria-label="Curated jewelry sets">
      <div className="container">
        {/* Editorial Section Heading */}
        <div className="sets-header-block">
          <span className="sets-caption">The Layering Edit</span>
          <h2 className="sets-headline">Curated sets, styled to wear together.</h2>
          <p className="sets-description">
            Save when you purchase complementary anti-tarnish pieces together. Each set arrives in a single microfiber travel pouch.
          </p>

          {/* Set Selector Tabs */}
          <div className="sets-tab-bar" role="tablist">
            {bundles.map((b, idx) => (
              <button
                key={b.id}
                role="tab"
                aria-selected={activeSetIndex === idx}
                className={`set-tab-item ${activeSetIndex === idx ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveSetIndex(idx);
                  setHasAdded(false);
                }}
              >
                {b.title}
              </button>
            ))}
          </div>
        </div>

        {/* Set Showcase Card */}
        <div className="set-presentation-stage">
          <div className="set-pieces-grid">
            {items.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="set-piece-card">
                <Link href={`/products/${item.slug || item.id}`} className="piece-visual-stage" style={{ background: item.imageBg || 'var(--canvas-subtle)', overflow: 'hidden' }}>
                  <span className="piece-category-label" style={{ zIndex: 2 }}>{item.subcategory}</span>
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="220px"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="piece-monochrome-wireframe">
                      <span>{item.title.split(' ')[0]} {item.subcategory}</span>
                    </div>
                  )}
                </Link>

                <div className="piece-details-meta">
                  <h4 className="piece-title">
                    <Link href={`/products/${item.slug || item.id}`}>{item.title}</Link>
                  </h4>
                  <div className="piece-price-row">
                    <span className="piece-price">₹{item.price}</span>
                    <span className="piece-mrp">₹{item.mrp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Set Purchasing Summary */}
          <div className="set-action-summary">
            <div className="set-pricing-row">
              <span className="set-price-emphasis">Set Price: ₹{activeBundle.bundlePrice}</span>
              <span className="set-mrp-reference">Total Value: ₹{activeBundle.totalMrp}</span>
              <span className="set-savings-note">Save {activeBundle.savingsPercent}% as a set</span>
            </div>

            <button
              type="button"
              className={`set-add-action ${hasAdded ? 'has-confirmed' : ''}`}
              onClick={handleAddBundle}
            >
              {hasAdded ? 'Complete set added to bag' : `Add entire set to bag (₹${activeBundle.bundlePrice})`}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
