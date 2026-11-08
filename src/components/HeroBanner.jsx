'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart, DEFAULT_PROMO_BANNERS } from '../context/CartContext';
import './HeroBanner.css';

export default function HeroBanner() {
  const { promoBanners } = useCart();
  const [liveBanners, setLiveBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Fetch live banners from MongoDB Atlas
  useEffect(() => {
    fetch('/api/banners')
      .then((res) => {
        if (!res.ok) return null;
        const ct = res.headers.get('content-type') || '';
        return ct.includes('application/json') ? res.json() : null;
      })
      .then((data) => {
        if (data && data.banners && data.banners.length > 0) {
          setLiveBanners(data.banners.filter((b) => b.active));
        }
      })
      .catch(() => {});
  }, []);

  // Active banners list, prioritizing MongoDB Atlas banners, then CartContext, then default fallback
  const activeBanners =
    liveBanners.length > 0
      ? liveBanners
      : (promoBanners || []).filter((b) => b.active);

  const banners = activeBanners.length > 0 ? activeBanners : DEFAULT_PROMO_BANNERS;

  // Auto-play interval (pauses on hover)
  useEffect(() => {
    if (isHovered || banners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [isHovered, banners.length]);

  // Touch swipe support for mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swipe left -> Next
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      } else {
        // Swipe right -> Prev
        setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
      }
    }
  };

  const safeIndex = currentIndex < banners.length ? currentIndex : 0;
  const activeBanner = banners[safeIndex] || banners[0];

  return (
    <section
      className="promo-gallery-hero-wrapper"
      aria-label="Promotional Campaign Gallery"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pure Clickable Promo Banner Image: Zero Overlaid Texts, Zero Buttons */}
      <Link
        href={activeBanner.redirectUrl || '/anti-tarnish-jewellery'}
        className="promo-slide-anchor"
        aria-label={activeBanner.title || 'Promotional Campaign Banner'}
      >
        <div className="promo-slide-stage">
          <div
            className="promo-image-viewport"
            style={{
              backgroundImage: `url(${activeBanner.imageUrl})`,
            }}
            role="img"
            aria-label={activeBanner.altText || activeBanner.title || 'Promotional Banner'}
          />
        </div>
      </Link>
    </section>
  );
}
