import Link from 'next/link';
import Image from 'next/image';
import Header from '../components/Header';
import HeroBanner from '../components/HeroBanner';
import TrustStrip from '../components/TrustStrip';
import ProductCard from '../components/ProductCard';
import CompleteTheLook from '../components/CompleteTheLook';
import WhatsAppWidget from '../components/WhatsAppWidget';
import Footer from '../components/Footer';
import { getLiveBestsellers, getLiveProductsByCategory, getHomepageCategories } from '../lib/catalog';
import { ArrowRight, ShieldCheck, Droplets, Feather, Check } from 'lucide-react';
import './page.css';

export const metadata = {
  title: "Satvastones: 18K Gold Plated Anti-Tarnish & Waterproof Jewellery India",
  description:
    "India's premier everyday demi-fine jewellery atelier. Buy 100% waterproof, sweatproof, and hypoallergenic 18K gold plated chains, Korean pearls, and modern mangalsutras starting ₹249. Cash on Delivery & 7-Day Easy Returns.",
  keywords: [
    "anti tarnish jewellery",
    "anti tarnish jewellery india",
    "waterproof jewellery online",
    "demi fine jewellery india",
    "18k gold plated jewellery",
    "korean jewellery online",
    "daily wear mangalsutra",
    "palmonas alternatives india",
    "skin safe jewellery",
    "satvastones",
  ],
  alternates: {
    canonical: "https://satvastones.com",
  },
  openGraph: {
    title: "Satvastones: Everyday Anti-Tarnish & Demi-Fine Luxury Jewellery",
    description: "Solid 316L medical stainless steel coated in 18k real gold through vacuum PVD bonding. 100% shower, gym, and sweat safe. Shop with COD.",
    url: "https://satvastones.com",
    type: "website",
    locale: "en_IN",
    siteName: "Satvastones",
    images: [
      {
        url: "https://satvastones.com/logo.png",
        width: 1200,
        height: 630,
        alt: "Satvastones Demi-Fine Jewellery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Satvastones | Anti-Tarnish & Demi-Fine Jewellery India",
    description: "Waterproof, gym-safe 18K gold plated demi-fine jewellery starting ₹249. Shop online with COD.",
    images: ["https://satvastones.com/logo.png"],
  },
};

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [bestsellers, koreanCollection, indianCollection, categories] = await Promise.all([
    getLiveBestsellers(8),
    getLiveProductsByCategory('korean').then((list) => list.slice(0, 4)),
    getLiveProductsByCategory('indian').then((list) => list.slice(0, 4)),
    getHomepageCategories(),
  ]);

  const editorialGuides = [
    {
      title: "Why physical vapour deposition outlasts conventional gold plating",
      readTime: "4 min read",
      category: "Materials",
      excerpt: "An overview of how molecular gold bonding over medical-grade 316L steel eliminates oxidisation and skin discolouration.",
      href: "/jewellery-care",
      bg: "linear-gradient(135deg, #f9f4ec 0%, #eee1cf 100%)",
    },
    {
      title: "The daily necklace layering guide: three proportions to know",
      readTime: "3 min read",
      category: "Styling",
      excerpt: "How to balance choker lengths with flat herringbone chains and single solitaire anchors for tangle-free wear.",
      href: "/western-jewellery",
      bg: "linear-gradient(135deg, #f6edf5 0%, #e8d5e7 100%)",
    },
    {
      title: "Modern mangalsutras designed for daily corporate wear",
      readTime: "5 min read",
      category: "Heritage",
      excerpt: "Lightweight, waterproof black-bead solitaires built for women who want heritage pieces without bulk.",
      href: "/indian-jewellery",
      bg: "linear-gradient(135deg, #fbf0ec 0%, #f7d5c9 100%)",
    },
  ];

  return (
    <>
      <Header />
      <main>
        {/* 1. Hero Campaign Banner */}
        <HeroBanner />

        {/* 2. 5-Pillar Standards Strip */}
        <TrustStrip />

        {/* 2.5 Editorial SEO Primary H1 Heading */}
        <section className="container" style={{ textAlign: 'center', paddingTop: '40px', paddingBottom: '12px' }}>
          <span className="editorial-kicker" style={{ display: 'block', marginBottom: '8px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', fontSize: '0.78rem', fontWeight: 600 }}>
            Atelier Standards
          </span>
          <h1 style={{ fontSize: 'clamp(1.8rem, 3.8vw, 2.6rem)', fontFamily: 'var(--font-editorial)', fontWeight: 500, letterSpacing: '-0.02em', maxWidth: '840px', margin: '0 auto 12px', lineHeight: 1.2 }}>
            Everyday 18K Gold Anti-Tarnish & Demi-Fine Jewellery
          </h1>
          <p style={{ maxWidth: '640px', margin: '0 auto', color: 'var(--ink-secondary)', fontSize: '0.96rem' }}>
            Solid 316L surgical stainless steel bonded with 18k real gold via vacuum PVD. 100% waterproof, sweatproof, and hypoallergenic for daily living.
          </p>
        </section>

        {/* 3. Category Tiles */}
        <section className="container home-category-strip" aria-label="Explore by category">
          <div className="section-title-centered">
            <span className="editorial-kicker">Catalog</span>
            <h2>Shop by category</h2>
            <p>From shower-safe chains to handcrafted heritage pieces</p>
          </div>

          <div className="category-tiles-grid">
            {categories.map((cat, idx) => (
              <Link key={cat.id || idx} href={cat.href || '/anti-tarnish-jewellery'} className="category-tile-card">
                <div className="category-tile-cover" style={{ background: cat.bg }}>
                  {cat.image ? (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 768px) 64px, 80px"
                      className="category-tile-img"
                      unoptimized={cat.image?.includes('cloudinary.com')}
                    />
                  ) : (
                    <span className="category-tile-initial">{cat.name.charAt(0)}</span>
                  )}
                </div>
                <h4 className="category-tile-name">{cat.name}</h4>
                <span className="category-tile-desc">{cat.count || cat.description}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. Anti-Tarnish Bestsellers Showcase */}
        <section className="home-bestsellers-band" aria-label="Most requested pieces">
          <div className="container">
            <div className="section-title-split">
              <div>
                <span className="editorial-kicker">Client favorites</span>
                <h2>Anti-tarnish bestsellers</h2>
                <p>18k gold over 316L surgical steel: waterproof and hypoallergenic</p>
              </div>
              <Link href="/anti-tarnish-jewellery" className="section-text-link hide-on-mobile">
                View all bestsellers <ArrowRight size={14} style={{ marginLeft: 4 }} />
              </Link>
            </div>

            <div className="home-products-grid">
              {bestsellers.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>

            <div className="section-mobile-action hide-on-desktop">
              <Link href="/anti-tarnish-jewellery" className="btn btn-secondary">
                View all bestsellers
              </Link>
            </div>
          </div>
        </section>

        {/* 5. AOV Booster: The Layering Edit */}
        <CompleteTheLook liveProducts={bestsellers} />

        {/* 6. Material Integrity & Craftsmanship Narrative */}
        <section className="craftsmanship-narrative-section" aria-label="Our craftsmanship">
          <div className="container">
            <div className="craftsmanship-block">
              <div className="craftsmanship-copy-col">
                <span className="editorial-kicker">Material science</span>
                <h2>Why our pieces remain untarnished over time</h2>
                <p>
                  Conventional imitation jewelry uses zinc alloy or brass coated with thin chemical lacquer. When exposed to water, humidity, or perspiration, the base metal reacts, producing copper carbonate, which leaves green marks on the skin.
                </p>
                <p>
                  Satvastones uses 316L medical-grade surgical stainless steel bonded with genuine 18k gold using vacuum physical vapour deposition (PVD). This process creates a molecular bond ten times denser than standard plating.
                </p>

                <div className="craftsmanship-points-list">
                  <div className="point-row">
                    <span className="point-icon-box"><Check size={16} /></span>
                    <span><strong>Waterproof integrity:</strong> Safe for morning showers, workouts, and ocean swims.</span>
                  </div>
                  <div className="point-row">
                    <span className="point-icon-box"><Check size={16} /></span>
                    <span><strong>Sensitive skin formulation:</strong> Completely free of nickel and lead.</span>
                  </div>
                  <div className="point-row">
                    <span className="point-icon-box"><Check size={16} /></span>
                    <span><strong>Direct pricing:</strong> Fine-grade steel and gold finishing without retail middle-tier markups.</span>
                  </div>
                </div>

                <Link href="/jewellery-care" className="btn btn-primary craftsmanship-cta">
                  Read the materials guide
                </Link>
              </div>

              <div className="craftsmanship-spec-table-col hide-on-mobile">
                <div className="materials-spec-table">
                  <div className="table-caption-bar">Technical Comparison</div>
                  <div className="spec-table-row header-row">
                    <span>Specification</span>
                    <span className="highlight-col">Satvastones</span>
                    <span>Standard Imitation</span>
                  </div>
                  <div className="spec-table-row">
                    <span className="spec-label">Base core</span>
                    <strong className="highlight-col">316L Surgical Steel</strong>
                    <span>Brass / Zinc</span>
                  </div>
                  <div className="spec-table-row">
                    <span className="spec-label">Plating method</span>
                    <strong className="highlight-col">18k Vacuum PVD</strong>
                    <span>Flash chemical dip</span>
                  </div>
                  <div className="spec-table-row">
                    <span className="spec-label">Water exposure</span>
                    <strong className="highlight-col">Shower and workout safe</strong>
                    <span>Tarnishes with moisture</span>
                  </div>
                  <div className="spec-table-row">
                    <span className="spec-label">Skin reaction</span>
                    <strong className="highlight-col">100% Hypoallergenic</strong>
                    <span>Common green residue</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Korean Minimalist Edit */}
        <section className="container home-collection-spotlight" aria-label="Korean collection">
          <div className="section-title-split">
            <div>
              <span className="editorial-kicker">Seoul edit</span>
              <h2>Korean minimalist jewelry</h2>
              <p>Freshwater pearls and lightweight designs with hypoallergenic S925 silver needles</p>
            </div>
            <Link href="/korean-jewellery" className="section-text-link">
              View Korean collection <ArrowRight size={14} style={{ marginLeft: 4 }} />
            </Link>
          </div>

          <div className="home-products-grid">
            {koreanCollection.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </section>

        {/* 8. Modern Indian Heritage Spotlight */}
        <section className="heritage-editorial-spotlight" aria-label="Indian heritage collection">
          <div className="container">
            <div className="section-title-split">
              <div>
                <span className="editorial-kicker kicker-gold">Heritage craftsmanship</span>
                <h2 className="text-on-dark">Modern Indian and daily mangalsutras</h2>
                <p className="text-on-dark-subtle">Authentic Kundan, Temple coins, and lightweight black-bead chains</p>
              </div>
              <Link href="/indian-jewellery" className="section-text-link link-on-dark">
                View Indian collection <ArrowRight size={14} style={{ marginLeft: 4 }} />
              </Link>
            </div>

            <div className="home-products-grid">
              {indianCollection.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        </section>

        {/* 9. Editorial Journal Guides */}
        <section className="home-journal-band" aria-label="Jewelry guides and articles">
          <div className="container">
            <div className="section-title-centered">
              <span className="editorial-kicker">The Satvastones Journal</span>
              <h2>Jewelry care and styling guides</h2>
              <p>Practical references on metal durability, layering lengths, and care</p>
              <Link href="/journal" className="section-text-link" style={{ marginTop: '10px', display: 'inline-flex' }}>
                Explore all journal guides <ArrowRight size={14} style={{ marginLeft: 4 }} />
              </Link>
            </div>

            <div className="journal-cards-grid">
              {editorialGuides.map((guide, idx) => (
                <article key={idx} className="journal-entry-card">
                  <div className="journal-cover" style={{ background: guide.bg }}>
                    <span className="journal-tag">{guide.category}</span>
                  </div>
                  <div className="journal-body">
                    <span className="journal-reading-estimate">{guide.readTime}</span>
                    <h3 className="journal-entry-title">
                      <Link href={guide.href}>{guide.title}</Link>
                    </h3>
                    <p className="journal-synopsis">{guide.excerpt}</p>
                    <Link href={guide.href} className="journal-continue-link">
                      Read guide <ArrowRight size={13} style={{ marginLeft: 4 }} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 10. First-Order Quiet Voucher Strip */}
        <section className="container first-order-voucher-band" aria-label="Client welcome">
          <div className="voucher-card-inner">
            <div className="voucher-copy">
              <span className="editorial-kicker kicker-gold">Welcome to Satvastones</span>
              <h2>₹200 off your initial order</h2>
              <p>Apply voucher code <strong>SATVA200</strong> at checkout. Valid on all collections with nationwide delivery.</p>
            </div>
            <Link href="/anti-tarnish-jewellery" className="btn btn-primary voucher-action-btn">
              Explore catalog
            </Link>
          </div>
        </section>
      </main>

      <WhatsAppWidget />
      <Footer />
    </>
  );
}
