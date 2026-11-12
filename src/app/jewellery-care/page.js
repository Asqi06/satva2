import Header from '../../components/Header';
import Footer from '../../components/Footer';
import TrustStrip from '../../components/TrustStrip';
import WhatsAppWidget from '../../components/WhatsAppWidget';
import Link from 'next/link';
import { Shield, Check, X, ArrowRight, Sparkles, Droplets, HeartHandshake } from 'lucide-react';
import { serializeJsonLd } from '../../lib/jsonLd';

export const metadata = {
  title: "Does Gold-Plated Jewellery Tarnish? PVD Science & Care Guide | Satvastones",
  description:
    "An authoritative guide on how 18k gold vacuum PVD plating over 316L surgical steel works, why it outlasts conventional electroplating, and how to care for your waterproof demi-fine jewelry.",
  keywords: [
    "does gold plated jewellery tarnish",
    "can you wear anti tarnish jewellery in shower",
    "how to clean gold plated jewellery at home",
    "does 18k pvd gold tarnish",
    "jewellery care guide india",
    "316l surgical steel jewelry benefits",
  ],
  alternates: {
    canonical: "https://satvastones.com/jewellery-care",
  },
  openGraph: {
    title: "The Ultimate Anti-Tarnish & Waterproof Jewellery Care Guide | Satvastones",
    description: "The science of 18k gold vacuum PVD coating over medical 316L surgical stainless steel. Complete daily care, cleaning, and warranty instructions.",
    url: "https://satvastones.com/jewellery-care",
    type: "article",
    locale: "en_IN",
    siteName: "Satvastones",
    images: [
      {
        url: "https://satvastones.com/logo.png",
        width: 1200,
        height: 630,
        alt: "Satvastones Jewellery Care & Material Standards",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Does 18K Gold PVD Jewellery Tarnish? | Satvastones Care Guide",
    description: "Learn how vacuum physical vapour deposition prevents fading and skin discoloration.",
    images: ["https://satvastones.com/logo.png"],
  },
};

export default function JewelleryCarePage() {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "The Complete Anti-Tarnish Jewellery Care & Material Science Guide",
    description: "A technical analysis of 18k gold vacuum PVD coating over 316L surgical steel, explaining how to care for waterproof demi-fine jewellery in India.",
    author: {
      "@type": "Organization",
      name: "Satvastones Atelier Research",
      url: "https://satvastones.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Satvastones",
      logo: {
        "@type": "ImageObject",
        url: "https://satvastones.com/logo.png",
      },
    },
    datePublished: "2026-09-15",
    dateModified: "2026-11-07",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "https://satvastones.com/jewellery-care",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Does 18K gold vacuum PVD plated jewellery tarnish over time?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Unlike traditional flash-plated jewelry that wears away in weeks, physical vapour deposition (PVD) vaporizes real 18k gold at high temperatures and deposits it onto surgical steel inside a high vacuum. This creates an atomic bond ten times thicker than electrolytic plating, rendering it immune to tarnishing from moisture, sweat, and air exposure.",
        },
      },
      {
        "@type": "Question",
        name: "How do I clean my waterproof gold jewellery at home?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Simply mix lukewarm water with a few drops of mild chemical-free liquid soap. Soak your piece for 3 minutes, gently wipe with a soft microfiber cloth, rinse under clear water, and pat dry. Never use harsh abrasive metal scouring pads or chlorine bleach.",
        },
      },
      {
        "@type": "Question",
        name: "Can I wear my pieces while exercising and swimming in the ocean?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. 316L medical stainless steel is naturally resistant to saltwater and chlorine. The 18k gold PVD layer will not corrode or oxidize during intense gym sessions or beach vacations.",
        },
      },
    ],
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
        name: "Jewellery Care Guide",
        item: "https://satvastones.com/jewellery-care",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }}
      />

      <Header />
      <main style={{ backgroundColor: 'var(--canvas)', paddingBottom: '80px' }}>
        {/* Editorial Header */}
        <section
          style={{
            backgroundColor: '#161513',
            color: '#FFFFFF',
            padding: '72px 24px',
            textAlign: 'center',
          }}
        >
          <div className="container" style={{ maxWidth: '780px' }}>
            <span
              style={{
                display: 'block',
                fontSize: '0.72rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--gold)',
                marginBottom: '10px',
                fontWeight: 600,
              }}
            >
              Atelier Engineering & Durability
            </span>
            <h1
              style={{
                fontFamily: 'var(--font-editorial)',
                fontSize: '2.8rem',
                color: '#FFFFFF',
                marginBottom: '16px',
                fontWeight: 500,
                lineHeight: 1.2,
              }}
            >
              Jewelry Care & Material Standards
            </h1>
            <p style={{ color: '#C8C5BD', fontSize: '0.98rem', lineHeight: 1.6 }}>
              A definitive breakdown of our 18k real gold vacuum PVD technology, medical 316L steel metallurgy, and simple daily maintenance guidelines.
            </p>
          </div>
        </section>

        {/* Technical Article Body */}
        <section className="container" style={{ maxWidth: '840px', marginTop: '48px' }}>
          {/* Card 1: PVD Science */}
          <article
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-xs)',
              padding: '40px',
              marginBottom: '24px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-editorial)',
                fontSize: '1.6rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'var(--ink)',
              }}
            >
              <Shield size={24} strokeWidth={1.5} style={{ color: 'var(--gold)' }} />
              What is Physical Vapour Deposition (PVD)?
            </h2>
            <p style={{ color: 'var(--ink-secondary)', lineHeight: 1.75, marginBottom: '14px', fontSize: '0.92rem' }}>
              Traditional fashion jewelry relies on electroplating, where copper, zinc, or brass is briefly immersed in an electrolytic chemical bath. This deposits an ultra-thin layer of gold (often less than 0.1 microns) that degrades quickly when exposed to humidity, perfumes, and skin acids, leaving greenish copper residue on the skin.
            </p>
            <p style={{ color: 'var(--ink-secondary)', lineHeight: 1.75, fontSize: '0.92rem' }}>
              Satvastones utilizes high-vacuum Physical Vapour Deposition (PVD). Inside an evacuated vacuum chamber, real 18k gold is evaporated at high temperatures into a gaseous plasma and blasted onto medical-grade 316L stainless steel. The gold atoms fuse directly with the crystalline lattice of the steel, resulting in a surface that is ten times thicker, completely impermeable to moisture, and resistant to corrosion, chlorine, and sweat.
            </p>
          </article>

          {/* Card 2: Do's and Don'ts */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-xs)',
                padding: '32px',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-editorial)',
                  fontSize: '1.25rem',
                  color: 'var(--forest)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Check size={20} /> Recommended Daily Use
              </h3>
              <ul
                style={{
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  fontSize: '0.88rem',
                  color: 'var(--ink)',
                  padding: 0,
                  margin: 0,
                }}
              >
                <li>✓ Daily morning hot showers with body washes and shampoos</li>
                <li>✓ High-intensity gym workouts, running, and heavy perspiration</li>
                <li>✓ Hand washing and contact with sanitizers</li>
                <li>✓ Swimming in chlorinated pools and ocean saltwater</li>
                <li>✓ Gentle cleaning with lukewarm water and a microfiber cloth</li>
              </ul>
            </div>

            <div
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-xs)',
                padding: '32px',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-editorial)',
                  fontSize: '1.25rem',
                  color: 'var(--crimson)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <X size={20} /> Precautions for Pearls & Gemstones
              </h3>
              <ul
                style={{
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  fontSize: '0.88rem',
                  color: 'var(--ink)',
                  padding: 0,
                  margin: 0,
                }}
              >
                <li>• Avoid spraying high-alcohol perfumes directly onto freshwater pearls</li>
                <li>• Avoid soaking pieces with set crystals in industrial chemical bleach</li>
                <li>• Avoid scrubbing metallic surfaces with coarse steel wool or abrasive powders</li>
                <li>• Store delicate chains individually inside your Satvastones travel pouch to prevent tangling</li>
              </ul>
            </div>
          </div>

          {/* Card 3: Free Velvet Pouch */}
          <div
            style={{
              backgroundColor: 'var(--canvas-subtle)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-xs)',
              padding: '40px',
              textAlign: 'center',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-editorial)',
                fontSize: '1.6rem',
                marginBottom: '10px',
                color: 'var(--ink)',
              }}
            >
              Complimentary Travel Pouch with Every Order
            </h3>
            <p
              style={{
                color: 'var(--ink-secondary)',
                maxWidth: '560px',
                margin: '0 auto 24px',
                fontSize: '0.92rem',
                lineHeight: 1.6,
              }}
            >
              Every Satvastones order includes a complimentary microfiber velvet protective pouch to keep your chains tangle-free and your earrings protected while on the move.
            </p>
            <Link href="/anti-tarnish-jewellery" className="btn btn-primary">
              Discover Anti-Tarnish Pieces <ArrowRight size={14} style={{ marginLeft: 6 }} />
            </Link>
          </div>
        </section>

        <div style={{ marginTop: '56px' }}>
          <TrustStrip />
        </div>
      </main>
      <WhatsAppWidget />
      <Footer />
    </>
  );
}
