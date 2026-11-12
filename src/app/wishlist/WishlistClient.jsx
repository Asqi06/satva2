'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { getProductById } from '../../data/products';
import ProductCard from '../../components/ProductCard';
import './page.css';

export default function WishlistClient() {
  const { wishlist, toggleWishlist, addToCart, isHydrated } = useCart();
  const [dbProducts, setDbProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products?limit=150')
      .then((res) => {
        if (!res.ok) return null;
        const ct = res.headers.get('content-type') || '';
        return ct.includes('application/json') ? res.json() : null;
      })
      .then((data) => {
        if (data?.products) setDbProducts(data.products);
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const savedProducts = wishlist
    .map((id) => {
      const fromStatic = getProductById(id);
      if (fromStatic) return fromStatic;
      return dbProducts.find((p) => String(p.id) === String(id) || String(p.mongoId) === String(id));
    })
    .filter(Boolean);

  if (!isHydrated || (isLoading && wishlist.length > 0 && savedProducts.length === 0)) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 20px', color: '#6e675f' }}>
        <p>Retrieving your saved atelier pieces...</p>
      </div>
    );
  }

  if (savedProducts.length === 0) {
    return (
      <div className="container wishlist-empty-frame">
        <div className="empty-heart-ring">
          <Heart size={32} strokeWidth={1.5} className="empty-heart-icon" />
        </div>
        <span className="wishlist-kicker">Satvastones Atelier</span>
        <h1 className="wishlist-empty-heading">You haven&apos;t saved any pieces yet</h1>
        <p className="wishlist-empty-text">
          Save your favorite waterproof chains, Korean minimalist hoops, and handcrafted mangalsutras for effortless layering.
        </p>
        <Link href="/anti-tarnish-jewellery" className="btn btn-primary wishlist-cta-btn">
          Explore Anti-Tarnish Collection <ArrowRight size={15} style={{ marginLeft: 6 }} />
        </Link>
      </div>
    );
  }

  return (
    <div className="container wishlist-page-layout">
      {/* Header Block */}
      <header className="wishlist-header-block">
        <span className="wishlist-kicker">Personal Curations</span>
        <h1 className="wishlist-main-title">Saved Pieces ({savedProducts.length})</h1>
        <p className="wishlist-subtitle">
          Pieces saved to your personal atelier wishlist. Ready to wear, waterproof, and guaranteed against tarnishing.
        </p>
      </header>

      {/* Grid of Saved Pieces */}
      <div className="wishlist-items-grid">
        {savedProducts.map((product) => (
          <div key={product.id} className="wishlist-item-wrapper">
            <ProductCard {...product} />
            <div className="wishlist-quick-actions">
              <button
                type="button"
                className="wishlist-move-btn"
                onClick={() => {
                  addToCart({
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    mrp: product.mrp,
                    finish: "18K Gold",
                    imageBg: product.imageBg,
                    subcategory: product.subcategory,
                    category: product.category,
                  });
                }}
              >
                <ShoppingBag size={15} /> Move to Bag
              </button>
              <button
                type="button"
                className="wishlist-delete-btn"
                onClick={() => toggleWishlist(product.id)}
                aria-label={`Remove ${product.title} from wishlist`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
