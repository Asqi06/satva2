'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

// Crisp, bespoke vector silhouettes for jewelry categories
function JewelrySilhouette({ subcategory }) {
  const type = subcategory?.toLowerCase() || '';

  if (type.includes('necklace') || type.includes('chain')) {
    return (
      <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="silhouette-svg">
        <path d="M6 3c0 6 3 13 6 13s6-7 6-13" />
        <circle cx="12" cy="17.5" r="1.5" />
      </svg>
    );
  }
  if (type.includes('earring') || type.includes('hoop')) {
    return (
      <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="silhouette-svg">
        <circle cx="8" cy="11" r="5" />
        <path d="M8 6V3" />
        <circle cx="16" cy="11" r="5" />
        <path d="M16 6V3" />
      </svg>
    );
  }
  if (type.includes('ring')) {
    return (
      <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="silhouette-svg">
        <circle cx="12" cy="13" r="6" />
        <polygon points="12 4 14 7 10 7 12 4" />
      </svg>
    );
  }
  if (type.includes('bracelet') || type.includes('bangle')) {
    return (
      <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="silhouette-svg">
        <ellipse cx="12" cy="12" rx="8" ry="5" />
        <path d="M12 7a5 2 0 0 1 0 10" />
      </svg>
    );
  }
  // Default pendant / mangalsutra
  return (
    <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="silhouette-svg">
      <path d="M5 4c0 7 3.5 13 7 13s7-6 7-13" />
      <polygon points="12 18 10 21 14 21 12 18" />
    </svg>
  );
}

export default function ProductCard(rawProps) {
  const props = rawProps.product || rawProps;
  const {
    id,
    slug,
    title,
    price,
    mrp,
    badge,
    subcategory,
    material = "18k gold plated steel",
    colors = ["#D4AF37", "#C0C0C0"],
    isCod = true,
    imageBg,
    secondaryBg,
    image,
    images,
  } = props;
  const { addToCart, toggleWishlist, isWishlisted } = useCart();
  const [selectedColor, setSelectedColor] = useState(colors[0] || "#D4AF37");
  const [isHovered, setIsHovered] = useState(false);
  const [added, setAdded] = useState(false);

  const displayImage = image || images?.[0]?.secureUrl || '';
  const hoverImage = images?.[1]?.secureUrl || displayImage;

  const saved = isWishlisted(id);
  const savings = Math.round(((mrp - price) / mrp) * 100);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id,
      title,
      price,
      mrp,
      finish: selectedColor === "#C0C0C0" ? "Polished Silver" : "18K Gold",
      imageBg,
      image: displayImage,
      subcategory,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <article
      className="boutique-product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Stage */}
      <div
        className="product-stage"
        style={{
          background: isHovered && secondaryBg ? secondaryBg : (imageBg || "var(--canvas-subtle)"),
        }}
      >
        {/* Subtle, purposeful badge */}
        {badge && (
          <span className="product-status-tag">
            {badge.toLowerCase().includes('bestseller') ? 'Bestseller' : badge}
          </span>
        )}

        {/* Wishlist toggle */}
        <button
          className={`product-wishlist-action ${saved ? 'is-active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(id);
          }}
          aria-label={saved ? `Remove ${title} from saved items` : `Save ${title} for later`}
        >
          <Heart size={16} fill={saved ? "var(--crimson)" : "none"} strokeWidth={1.5} />
        </button>

        {/* Real Product Image or Bespoke Vector Silhouette */}
        <Link href={`/products/${slug || id}`} className="product-image-anchor">
          {displayImage ? (
            <Image
              src={isHovered && hoverImage ? hoverImage : displayImage}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="product-card-img"
              priority={false}
            />
          ) : (
            <div className="product-silhouette-anchor">
              <JewelrySilhouette subcategory={subcategory} />
              <span className="product-material-caption">{material}</span>
            </div>
          )}
        </Link>
      </div>

      {/* Product Metadata */}
      <div className="product-info-block">
        <div className="product-header-row">
          <h3 className="product-heading">
            <Link href={`/products/${slug || id}`}>{title}</Link>
          </h3>
        </div>

        {/* Price Row */}
        <div className="product-pricing">
          <span className="current-price">₹{price}</span>
          {mrp > price && (
            <>
              <span className="original-price">₹{mrp}</span>
              <span className="discount-tag">{savings}% off</span>
            </>
          )}
        </div>

        {/* Color variants if multiple */}
        {colors && colors.length > 1 && (
          <div className="color-palette-options" aria-label="Available finishes">
            {colors.map((colorHex, idx) => (
              <button
                key={idx}
                type="button"
                className={`color-disc ${selectedColor === colorHex ? 'is-selected' : ''}`}
                style={{ backgroundColor: colorHex }}
                onClick={() => setSelectedColor(colorHex)}
                aria-label={`Select ${colorHex === '#D4AF37' ? 'gold' : colorHex === '#C0C0C0' ? 'silver' : 'rose gold'} finish`}
              />
            ))}
          </div>
        )}

        {/* Add to Bag Action */}
        <button
          type="button"
          className={`product-add-button ${added ? 'has-added' : ''}`}
          onClick={handleAddToCart}
        >
          {added ? 'Added to bag' : 'Add to bag'}
        </button>
      </div>
    </article>
  );
}
