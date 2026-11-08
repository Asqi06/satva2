'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, Check } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 3500);
      setEmail('');
    }
  };

  return (
    <footer className="atelier-footer" aria-label="Site footer">
      <div className="container footer-content-grid">
        {/* Brand Narrative */}
        <div className="footer-narrative-col">
          <Link href="/" className="footer-logo-link" aria-label="Satvastones Homepage">
            <Image
              src="/logo-white.png"
              alt="Satvastones"
              width={190}
              height={58}
              className="footer-brand-logo-image"
            />
          </Link>
          <p className="footer-manifesto">
            Demi-fine jewelry engineered for daily wear. Solid 316L surgical stainless steel dipped in 18k real gold through vacuum PVD bonding.
          </p>
          <div className="footer-contact-details">
            <p><MapPin size={14} className="contact-icon" /> Mumbai atelier, India</p>
            <p><Phone size={14} className="contact-icon" /> Concierge: +91 98765 43210</p>
            <p><Mail size={14} className="contact-icon" /> support@satvastones.com</p>
          </div>
        </div>

        {/* Collections */}
        <div className="footer-nav-col">
          <h4 className="footer-col-title">Collections</h4>
          <ul className="footer-link-tree">
            <li><Link href="/anti-tarnish-jewellery">Anti-tarnish bestsellers</Link></li>
            <li><Link href="/waterproof-jewellery">100% Waterproof jewellery</Link></li>
            <li><Link href="/korean-jewellery">Korean minimalist</Link></li>
            <li><Link href="/western-jewellery">Western layering chains</Link></li>
            <li><Link href="/indian-jewellery">Indian heritage &amp; mangalsutra</Link></li>
            <li><Link href="/sale">Curated sets</Link></li>
          </ul>
        </div>

        {/* Customer Care */}
        <div className="footer-nav-col">
          <h4 className="footer-col-title">Client care</h4>
          <ul className="footer-link-tree">
            <li><Link href="/journal">Atelier Journal &amp; Guides</Link></li>
            <li><Link href="/jewellery-care">Materials and durability guide</Link></li>
            <li><Link href="/account">Client portal &amp; live tracking</Link></li>
            <li><Link href="/anti-tarnish-jewellery">18k PVD guarantee</Link></li>
          </ul>
        </div>

        {/* Newsletter / Direct Invitation */}
        <div className="footer-newsletter-col">
          <h4 className="footer-col-title">Atelier updates</h4>
          <p className="newsletter-explainer">
            Receive design release notes, styling guides, and ₹200 off your initial order.
          </p>
          <form className="newsletter-form-row" onSubmit={handleSubscribe}>
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Email address for newsletter"
            />
            <button type="submit" className="newsletter-submit-btn">
              {subscribed ? <Check size={14} /> : "Join"}
            </button>
          </form>
          {subscribed && (
            <p className="newsletter-acknowledgement">
              Thank you. Use voucher code <strong>SATVA200</strong> at checkout for ₹200 off.
            </p>
          )}
        </div>
      </div>

      {/* Sub-footer Bar */}
      <div className="footer-sub-bar">
        <div className="container sub-bar-inner">
          <p className="copyright-line">
            &copy; {new Date().getFullYear()} Satvastones Luxury. All rights reserved.
          </p>
          <div className="settlement-options">
            <span>Cash on delivery</span>
            <span className="dot-divider">•</span>
            <span>UPI</span>
            <span className="dot-divider">•</span>
            <span>RuPay</span>
            <span className="dot-divider">•</span>
            <span>Visa & Mastercard</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
