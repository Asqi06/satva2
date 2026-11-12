import Header from '../../components/Header';
import Footer from '../../components/Footer';
import TrustStrip from '../../components/TrustStrip';
import WhatsAppWidget from '../../components/WhatsAppWidget';
import Link from 'next/link';
import { ArrowRight, Clock, BookOpen, ShieldCheck } from 'lucide-react';
import './journal.css';
import { serializeJsonLd } from '../../lib/jsonLd';

export const metadata = {
  title: "Atelier Journal | Anti-Tarnish Metallurgy, Care & Styling | Satvastones",
  description:
    "Explore authoritative articles on 18k gold vacuum PVD metallurgy, preventing jewelry from tarnishing, Korean vs Indian fusion aesthetics, and everyday stacking guides.",
  keywords: [
    "jewellery care blog india",
    "does gold plated jewellery tarnish",
    "how to clean 18k pvd jewellery",
    "korean vs western jewellery",
    "modern mangalsutra styling",
    "waterproof jewellery guide india",
  ],
  alternates: {
    canonical: "https://satvastones.com/journal",
  },
  openGraph: {
    title: "Satvastones Atelier Journal | Everyday Demi-Fine Insights",
    description: "In-depth guides on metallurgy, anti-tarnish durability, and daily jewellery styling.",
    url: "https://satvastones.com/journal",
    type: "website",
    locale: "en_IN",
    siteName: "Satvastones",
    images: [
      {
        url: "https://satvastones.com/logo.png",
        width: 1200,
        height: 630,
        alt: "Satvastones Atelier Journal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Satvastones Atelier Journal | Jewellery Care & Styling",
    description: "The science of 18k gold vacuum PVD and daily styling rules.",
    images: ["https://satvastones.com/logo.png"],
  },
};

const articles = [
  {
    slug: "does-gold-plated-jewellery-tarnish",
    title: "Does Gold-Plated Jewellery Tarnish? The Science of Flash Plating vs Vacuum PVD",
    readTime: "4 min read",
    category: "Metallurgy",
    excerpt: "Why traditional fashion jewellery oxidizes into green copper residue within weeks in Indian climates, and how vacuum PVD molecular bonding on 316L surgical steel creates permanent waterproof durability.",
    href: "/jewellery-care",
    date: "12 Oct 2026",
    imageBg: "linear-gradient(135deg, #f9f4ec 0%, #eee1cf 100%)",
  },
  {
    slug: "daily-necklace-layering-guide",
    title: "The Everyday Chain Layering Guide: Three Proportions to Know",
    readTime: "3 min read",
    category: "Styling",
    excerpt: "How to balance choker lengths (14-16 inches) with flat herringbone chains (18 inches) and single solitaire pendants (20-22 inches) for comfortable, tangle-free daily wear.",
    href: "/western-jewellery",
    date: "24 Oct 2026",
    imageBg: "linear-gradient(135deg, #f6edf5 0%, #e8d5e7 100%)",
  },
  {
    slug: "modern-mangalsutras-for-corporate-wear",
    title: "Modern Solitaire Mangalsutras Designed for Corporate Office Wear",
    readTime: "5 min read",
    category: "Heritage",
    excerpt: "Lightweight, waterproof black-bead solitaires engineered for women who want sacred heritage without heavy traditional bulk under formal shirts and blazers.",
    href: "/indian-jewellery",
    date: "02 Nov 2026",
    imageBg: "linear-gradient(135deg, #fbf0ec 0%, #f7d5c9 100%)",
  },
  {
    slug: "korean-minimalist-vs-western-stacking",
    title: "Korean Minimalist vs Western Stacking: Which Fits Your Personal Style?",
    readTime: "4 min read",
    category: "Design",
    excerpt: "Explore the contrast between Seoul-inspired dainty freshwater pearl aesthetics and bold Western chunky croissant rings. Tips for blending both effortlessly.",
    href: "/korean-jewellery",
    date: "05 Nov 2026",
    imageBg: "linear-gradient(135deg, #edf7ee 0%, #d8ebd9 100%)",
  },
];

export default function JournalPage() {
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Satvastones Atelier Journal",
    url: "https://satvastones.com/journal",
    description: "Authoritative guides on 18K gold vacuum PVD metallurgy, anti-tarnish jewelry care, and daily styling.",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://satvastones.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Atelier Journal",
        item: "https://satvastones.com/journal",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(blogSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }}
      />
      <Header />
      <main className="journal-page-main">
        {/* Editorial Header */}
        <header className="journal-hero-banner">
          <div className="container journal-hero-content">
            <span className="journal-kicker">The Editorial Archive</span>
            <h1 className="journal-title">Atelier Journal &amp; Guides</h1>
            <p className="journal-subtitle">
              Demystifying jewellery metallurgy, waterproof durability standards, and daily styling rituals for modern women.
            </p>
          </div>
        </header>

        {/* Articles Grid */}
        <section className="container journal-grid-section" aria-label="Published articles">
          <div className="journal-articles-grid">
            {articles.map((article, idx) => (
              <article key={idx} className="journal-article-card">
                <div className="article-cover" style={{ background: article.imageBg }}>
                  <span className="article-badge">{article.category}</span>
                </div>
                <div className="article-body">
                  <div className="article-meta-row">
                    <span>{article.date}</span>
                    <span>•</span>
                    <span className="article-read-time">
                      <Clock size={12} style={{ marginRight: 4 }} /> {article.readTime}
                    </span>
                  </div>
                  <h2 className="article-heading">
                    <Link href={article.href}>{article.title}</Link>
                  </h2>
                  <p className="article-excerpt">{article.excerpt}</p>
                  <Link href={article.href} className="article-link">
                    Read article <ArrowRight size={13} style={{ marginLeft: 4 }} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Material Guarantee Banner */}
        <section className="container" style={{ marginBottom: '64px' }}>
          <div className="journal-guarantee-box">
            <ShieldCheck size={28} className="text-gold" />
            <div>
              <h3>Our Editorial &amp; Material Standards</h3>
              <p>
                Every piece crafted at Satvastones follows medical-grade 316L stainless steel metallurgy with 18k real gold vacuum PVD bonding. We never cut corners with brass, copper, or lead.
              </p>
            </div>
            <Link href="/anti-tarnish-jewellery" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
              Explore Collection
            </Link>
          </div>
        </section>

        <TrustStrip />
      </main>
      <WhatsAppWidget />
      <Footer />
    </>
  );
}
