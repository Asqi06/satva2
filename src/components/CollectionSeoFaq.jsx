'use client';
import { useState } from 'react';
import Link from 'next/link';
import { serializeJsonLd } from '../lib/jsonLd';
import { ChevronDown, ShieldCheck, Droplets, Sparkles, Check, ArrowRight } from 'lucide-react';
import './CollectionSeoFaq.css';

export default function CollectionSeoFaq({
  categoryName = "Anti-Tarnish Jewellery",
  categorySlug = "anti-tarnish-jewellery",
  faqs = [],
  seoGuideTitle = "The Definitive Guide to Everyday Anti-Tarnish Jewellery",
  seoGuideSections = [],
  relatedTags = [],
}) {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  // Automated schema.org/FAQPage JSON-LD for Google Rich Snippets
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <section className="collection-seo-faq-section" aria-label="Buyer Guide & Frequently Asked Questions">
      {/* Automated Google SERP FAQ Schema */}
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqSchema) }}
        />
      )}

      <div className="container">
        {/* 1. Deep Editorial Buyer Guide (Ranks for Organic Search Queries) */}
        <div className="collection-seo-guide-card">
          <div className="guide-header">
            <span className="guide-kicker">Atelier Insights</span>
            <h2 className="guide-title">{seoGuideTitle}</h2>
            <p className="guide-subtitle">
              Engineered for everyday living. Learn how medical-grade 316L stainless steel and vacuum physical vapour deposition (PVD) outlast conventional gold plating in Indian conditions.
            </p>
          </div>

          <div className="guide-content-grid">
            {seoGuideSections.map((sec, idx) => (
              <article key={idx} className="guide-section-block">
                <h3 className="guide-section-heading">{sec.heading}</h3>
                <div className="guide-section-text">
                  {sec.paragraphs.map((p, pIdx) => (
                    <p key={pIdx}>{p}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>

          {/* Standards Matrix Comparison */}
          <div className="guide-comparison-box">
            <h3 className="comparison-box-title">Material Standards Comparison</h3>
            <div className="comparison-table-wrapper">
              <table className="seo-comparison-table">
                <thead>
                  <tr>
                    <th>Specification</th>
                    <th>Satvastones Atelier</th>
                    <th>Conventional Fashion Jewellery</th>
                    <th>Palmonas / Premium Plated</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Base Metallurgy</strong></td>
                    <td className="highlight-cell">316L Surgical Stainless Steel</td>
                    <td>Brass, Copper, or Zinc Alloy</td>
                    <td>316L Stainless Steel / Silver</td>
                  </tr>
                  <tr>
                    <td><strong>Gold Bonding Process</strong></td>
                    <td className="highlight-cell">18K Real Gold Vacuum PVD</td>
                    <td>Electrolytic Flash Plating</td>
                    <td>PVD Vacuum Coating</td>
                  </tr>
                  <tr>
                    <td><strong>Shower & Gym Exposure</strong></td>
                    <td className="highlight-cell">100% Shower &amp; Sweat Safe</td>
                    <td>Turns Black / Green within weeks</td>
                    <td>Water-resistant</td>
                  </tr>
                  <tr>
                    <td><strong>Skin Safety Credentials</strong></td>
                    <td className="highlight-cell">Hypoallergenic &amp; Nickel-Free</td>
                    <td>Can cause skin irritation</td>
                    <td>Hypoallergenic</td>
                  </tr>
                  <tr>
                    <td><strong>Price Range</strong></td>
                    <td className="highlight-cell">₹299 to ₹699 (Fair Luxury)</td>
                    <td>₹199 to ₹399 (Short lifespan)</td>
                    <td>₹999 to ₹2,999 (Celebrity markup)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 2. Interactive FAQ Accordion (Powers SERP Expandable Results) */}
        {faqs.length > 0 && (
          <div className="collection-faqs-wrapper">
            <div className="faqs-header">
              <span className="guide-kicker">Client Inquiries</span>
              <h2 className="faqs-title">Frequently Asked Questions</h2>
              <p className="faqs-subtitle">
                Everything you need to know about wearing, washing, and caring for your waterproof demi-fine jewelry.
              </p>
            </div>

            <div className="faqs-accordion-list">
              {faqs.map((faq, index) => {
                const isOpen = openIndex === index;
                return (
                  <div
                    key={index}
                    className={`faq-accordion-item ${isOpen ? 'is-open' : ''}`}
                  >
                    <button
                      type="button"
                      className="faq-question-button"
                      onClick={() => toggleFaq(index)}
                      aria-expanded={isOpen}
                    >
                      <span className="faq-question-text">{faq.question}</span>
                      <ChevronDown
                        size={18}
                        className={`faq-icon ${isOpen ? 'is-rotated' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="faq-answer-panel">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Semantic Internal Linking Silo (Distributes PageRank to Catalog Categories) */}
        {relatedTags.length > 0 && (
          <div className="collection-internal-links-bar">
            <span className="links-bar-label">Explore Related Collections:</span>
            <div className="links-pills-row">
              {relatedTags.map((tag, tIdx) => (
                <Link key={tIdx} href={tag.href} className="related-cat-pill">
                  {tag.label} <ArrowRight size={12} style={{ marginLeft: 4 }} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
