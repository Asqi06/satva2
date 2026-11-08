'use client';
import { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, ShoppingBag, Heart, User, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './Header.css';

const emptySubscribe = () => () => {};

export default function Header() {
  const router = useRouter();
  const { itemCount, subtotal, wishlist, openMiniBag, currentUser } = useCart();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className={`site-header-wrapper ${isScrolled ? 'header-scrolled' : ''}`}>
      {/* Quiet, Single Announcement Bar */}
      <aside className="header-announcement" aria-label="Current dispatch notification">
        <div className="container announcement-content">
          <p>
            Complimentary delivery on orders above ₹499. Cash on delivery available nationwide.
          </p>
        </div>
      </aside>

      {/* Main Header Bar */}
      <div className="container header-primary-row">
        {/* Mobile menu trigger */}
        <button
          type="button"
          className="mobile-nav-toggle hide-on-desktop"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={22} strokeWidth={1.5} />
        </button>

        {/* Brand Logotype */}
        <div className="brand-signature">
          <Link href="/" className="brand-logo-anchor" aria-label="Satvastones Homepage">
            <Image
              src="/logo.png"
              alt="Satvastones"
              width={185}
              height={57}
              priority
              className="brand-logo-image"
            />
          </Link>
        </div>

        {/* Minimalist Search Bar */}
        <div className="header-search-wrap hide-on-mobile">
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <Search size={16} strokeWidth={1.5} className="search-icon" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search waterproof chains, pearl earrings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search collection"
            />
          </form>
        </div>

        {/* Account, Wishlist & Bag Actions */}
        <div className="header-utility-group">
          <Link href="/wishlist" className="utility-item hide-on-mobile" aria-label="Saved pieces">
            <Heart size={19} strokeWidth={1.5} />
            <span className="utility-label">
              Saved {mounted && wishlist?.length > 0 ? `(${wishlist.length})` : ''}
            </span>
          </Link>

          <Link href="/account" className="utility-item hide-on-mobile" aria-label="Account">
            <User size={19} strokeWidth={1.5} />
            <span className="utility-label">{mounted && currentUser ? currentUser.name?.split(' ')[0] : 'Sign in'}</span>
          </Link>

          <button
            type="button"
            className="utility-item bag-utility bag-button-reset"
            onClick={openMiniBag}
            aria-label="Shopping bag"
          >
            <div className="bag-badge-wrapper">
              <ShoppingBag size={19} strokeWidth={1.5} />
              {mounted && (itemCount || 0) > 0 && <span className="bag-counter">{itemCount}</span>}
            </div>
            <span className="utility-label hide-on-mobile">
              Bag {mounted && (subtotal || 0) > 0 ? `(₹${subtotal})` : ''}
            </span>
          </button>
        </div>
      </div>

      {/* Desktop Main Navigation */}
      <nav className="desktop-navigation-bar hide-on-mobile" aria-label="Main navigation">
        <div className="container">
          <ul className="nav-primary-list">
            <li>
              <Link href="/anti-tarnish-jewellery" className="nav-item-link is-featured">
                Anti-Tarnish
              </Link>
            </li>
            <li>
              <Link href="/korean-jewellery" className="nav-item-link">
                Korean Minimalist
              </Link>
            </li>
            <li>
              <Link href="/western-jewellery" className="nav-item-link">
                Western & Stacking
              </Link>
            </li>
            <li>
              <Link href="/indian-jewellery" className="nav-item-link">
                Indian Heritage
              </Link>
            </li>
            <li>
              <Link href="/sale" className="nav-item-link">
                Curated Sets
              </Link>
            </li>
            <li>
              <Link href="/jewellery-care" className="nav-item-link text-subtle">
                Care Guide
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile Search Row */}
      <div className="mobile-search-row hide-on-desktop">
        <form className="search-form" onSubmit={handleSearchSubmit}>
          <Search size={15} strokeWidth={1.5} className="search-icon" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search our catalog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search catalog"
          />
        </form>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <aside className="mobile-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-top-row">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} aria-label="Satvastones Homepage">
                <Image
                  src="/logo.png"
                  alt="Satvastones"
                  width={145}
                  height={45}
                  className="drawer-logo-image"
                />
              </Link>
              <button
                type="button"
                className="drawer-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <ul className="drawer-links-nav">
              <li>
                <Link href="/anti-tarnish-jewellery" onClick={() => setMobileMenuOpen(false)}>
                  Anti-Tarnish Collection
                </Link>
              </li>
              <li>
                <Link href="/korean-jewellery" onClick={() => setMobileMenuOpen(false)}>
                  Korean Minimalist
                </Link>
              </li>
              <li>
                <Link href="/western-jewellery" onClick={() => setMobileMenuOpen(false)}>
                  Western & Stacking
                </Link>
              </li>
              <li>
                <Link href="/indian-jewellery" onClick={() => setMobileMenuOpen(false)}>
                  Indian Heritage & Mangalsutras
                </Link>
              </li>
              <li>
                <Link href="/sale" onClick={() => setMobileMenuOpen(false)}>
                  Curated Sets
                </Link>
              </li>
              <li>
                <Link href="/jewellery-care" onClick={() => setMobileMenuOpen(false)}>
                  Materials & Care Guide
                </Link>
              </li>
            </ul>

            <div className="drawer-mobile-utilities">
              <Link
                href="/wishlist"
                className="drawer-util-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Heart size={18} strokeWidth={1.5} />
                <span>Saved Pieces {mounted ? `(${wishlist.length})` : ''}</span>
              </Link>
              <Link
                href="/account"
                className="drawer-util-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User size={18} strokeWidth={1.5} />
                <span>{mounted && currentUser ? `Account (${currentUser.name?.split(' ')[0]})` : 'My Account & Orders'}</span>
              </Link>
              <button
                type="button"
                className="drawer-util-link drawer-util-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openMiniBag();
                }}
              >
                <ShoppingBag size={18} strokeWidth={1.5} />
                <span>Shopping Bag {mounted ? `(${itemCount})` : ''}</span>
              </button>
            </div>

            <div className="drawer-footer-note">
              <p>Waterproof 18k gold over 316L surgical steel.</p>
              <p>Dispatched with care from Mumbai.</p>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
