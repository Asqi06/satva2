'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { useCart, DEFAULT_PROMO_BANNERS } from '../context/CartContext';
import './HeroBanner.css';

export default function HeroBanner() {
  const { promoBanners } = useCart();
  const [liveBanners, setLiveBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);

  useEffect(() => {
    fetch('/api/banners')
      .then((res) => {
        if (!res.ok) return null;
        return (res.headers.get('content-type') || '').includes('application/json') ? res.json() : null;
      })
      .then((data) => {
        if (data?.banners?.length) setLiveBanners(data.banners.filter((banner) => banner.active && banner.imageUrl));
      })
      .catch(() => {});
  }, []);

  const activeBanners = liveBanners.length
    ? liveBanners
    : (promoBanners || []).filter((banner) => banner.active && banner.imageUrl);
  const banners = activeBanners.length ? activeBanners : DEFAULT_PROMO_BANNERS;
  const safeIndex = currentIndex < banners.length ? currentIndex : 0;
  const activeBanner = banners[safeIndex];
  const move = (direction) => setCurrentIndex((index) => (index + direction + banners.length) % banners.length);

  return (
    <section className="home-hero" aria-label="Featured jewellery and collections">
      <div className="home-hero-inner">
        <div className="home-hero-copy">
          <span className="editorial-kicker">Considered pieces, made for every day</span>
          <h1>Everyday 18K Gold Anti-Tarnish &amp; Demi-Fine Jewellery</h1>
          <p>Solid 316L surgical stainless steel bonded with 18K real gold via vacuum PVD. Shower-safe, sweatproof pieces made to stay with you.</p>
          <div className="home-hero-actions">
            <Link href="/anti-tarnish-jewellery" className="home-hero-primary">Shop anti-tarnish <ArrowRight size={16} /></Link>
            <Link href="#categories" className="home-hero-secondary">Explore collections <ArrowDown size={15} /></Link>
          </div>
          <div className="home-hero-assurance"><span>316L stainless steel</span><i aria-hidden="true" /><span>18K gold PVD</span><i aria-hidden="true" /><span>Made for daily wear</span></div>
        </div>

        <div
          className="home-hero-feature"
          onTouchStart={(event) => { touchStartX.current = event.touches[0].clientX; }}
          onTouchEnd={(event) => {
            const distance = touchStartX.current - event.changedTouches[0].clientX;
            if (Math.abs(distance) > 48) move(distance > 0 ? 1 : -1);
          }}
        >
          <Link
            href={activeBanner.redirectUrl || '/anti-tarnish-jewellery'}
            className="home-hero-image-link"
            aria-label={`Shop ${activeBanner.title || 'featured collection'}`}
          >
            <Image
              src={activeBanner.imageUrl}
              alt={activeBanner.altText || activeBanner.title || 'Featured jewellery'}
              fill
              priority={safeIndex === 0}
              sizes="(max-width: 680px) 100vw, 58vw"
              className="home-hero-image"
            />
            <div className="home-hero-feature-caption">
              <span>{activeBanner.badge || 'The Satvastones edit'}</span>
              <strong>{activeBanner.title || 'Everyday, elevated.'}</strong>
              <small>{activeBanner.tagline || 'Discover pieces made for the way you live.'}</small>
              <em>Discover the edit <ArrowRight size={14} /></em>
            </div>
          </Link>
          {banners.length > 1 && (
            <div className="home-hero-controls" aria-label="Featured collection controls">
              <div className="home-hero-dots" aria-label="Choose a featured collection">
                {banners.map((banner, index) => (
                  <button key={banner.id || index} type="button" className={index === safeIndex ? 'is-active' : ''} aria-label={`Show ${banner.title || `collection ${index + 1}`}`} aria-pressed={index === safeIndex} onClick={() => setCurrentIndex(index)} />
                ))}
              </div>
              <div className="home-hero-arrows">
                <button type="button" aria-label="Previous collection" onClick={() => move(-1)}><ArrowLeft size={16} /></button>
                <button type="button" aria-label="Next collection" onClick={() => move(1)}><ArrowRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
