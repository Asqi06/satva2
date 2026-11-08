'use client';
import Link from 'next/link';
import './IndianSpotlight.css';

export default function IndianSpotlight() {
  return (
    <section className="indian-spotlight pt-6 pb-6 mt-4 mb-4">
      <div className="container">
        <div className="is-content animate-fade-in">
          <span className="is-badge">Handcrafted in India</span>
          <h2 className="is-title">Naye zamane mein, asli zevar ka ehsaas</h2>
          <p className="is-desc">Discover the richness of authentic Kundan, Temple, and Meenakari craftsmanship, tailored for modern traditionalists.</p>
          
          <div className="is-features">
            <div className="is-feature">
              <span>Rajasthan&apos;s Kundan</span>
            </div>
            <div className="is-feature">
              <span>South Indian Temple</span>
            </div>
            <div className="is-feature">
              <span>Oxidised Silver</span>
            </div>
          </div>

          <Link href="/indian-jewellery" className="btn btn-primary is-btn">
            Explore Indian Jewellery
          </Link>
        </div>
      </div>
    </section>
  );
}
