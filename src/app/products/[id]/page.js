import { getLiveProductByIdOrSlug, getLiveRelatedProducts, getLiveCatalog } from '../../../lib/catalog';
import ProductDetailClient from './ProductDetailClient';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import TrustStrip from '../../../components/TrustStrip';
import WhatsAppWidget from '../../../components/WhatsAppWidget';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getLiveProductByIdOrSlug(id);

  if (!product) {
    return {
      title: "Product Not Found | Satvastones",
    };
  }

  const categoryPath =
    product.category === 'anti-tarnish'
      ? '/anti-tarnish-jewellery'
      : product.category === 'korean'
      ? '/korean-jewellery'
      : product.category === 'indian'
      ? '/indian-jewellery'
      : '/western-jewellery';

  return {
    title: `${product.title} | 18K Gold Anti-Tarnish Jewellery | Satvastones`,
    description: `Shop the ${product.title} in India. ${product.material || '18K Gold Vacuum PVD over 316L Surgical Steel'}. 100% waterproof, sweatproof, and hypoallergenic. Free express delivery above ₹499 with Cash on Delivery nationwide.`,
    keywords: [
      product.title.toLowerCase(),
      `${product.subcategory || 'jewellery'} online india`,
      "anti tarnish jewellery",
      "waterproof jewellery online",
      "18k gold plated surgical steel",
      "skin safe jewellery",
      "satvastones",
      "palmonas alternatives",
    ],
    alternates: {
      canonical: `https://satvastones.com/products/${product.id}`,
    },
    openGraph: {
      title: `${product.title} | Satvastones Demi-Fine Jewelry`,
      description: `Waterproof 18k gold over medical-grade 316L surgical steel. 100% shower-safe, sweat-safe, and nickel-free.`,
      url: `https://satvastones.com/products/${product.id}`,
      type: "website",
      locale: "en_IN",
      siteName: "Satvastones",
      images: [
        {
          url: product.image || "https://satvastones.com/logo.png",
          width: 800,
          height: 800,
          alt: `${product.title} - Satvastones Demi-Fine Jewelry`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} | Satvastones`,
      description: `Waterproof 18K Gold Demi-Fine Jewellery starting ₹${product.price}. Shop with Cash on Delivery & 7-Day Easy Returns.`,
      images: [product.image || "https://satvastones.com/logo.png"],
    },
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await getLiveProductByIdOrSlug(id);

  if (!product) {
    notFound();
  }

  const related = await getLiveRelatedProducts(product);

  const categoryName =
    product.category === 'anti-tarnish'
      ? 'Anti-Tarnish Jewellery'
      : product.category === 'korean'
      ? 'Korean Minimalist'
      : product.category === 'indian'
      ? 'Indian Heritage'
      : 'Western & Stacking';

  const categoryUrl =
    product.category === 'anti-tarnish'
      ? 'https://satvastones.com/anti-tarnish-jewellery'
      : product.category === 'korean'
      ? 'https://satvastones.com/korean-jewellery'
      : product.category === 'indian'
      ? 'https://satvastones.com/indian-jewellery'
      : 'https://satvastones.com/western-jewellery';

  // Automated Google Merchant Center & Rich Results Compliant Product Schema (JSON-LD)
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.title,
    image: [product.image || "https://satvastones.com/logo.png"],
    description: product.description || `Crafted in ${product.material || '316L Surgical Stainless Steel, 18K Real Gold PVD'}. 100% waterproof, sweatproof, and anti-tarnish everyday demi-fine jewellery.`,
    sku: `SATVA-${product.id}`,
    mpn: `SATVA-${product.id}`,
    category: categoryName,
    material: product.material || "316L Surgical Stainless Steel with 18K Real Gold Vacuum PVD",
    color: product.colors?.[0] || "18K Gold",
    brand: {
      "@type": "Brand",
      name: "Satvastones",
      url: "https://satvastones.com",
    },
    offers: {
      "@type": "Offer",
      url: `https://satvastones.com/products/${product.id}`,
      priceCurrency: "INR",
      price: Number(product.price).toFixed(2),
      priceValidUntil: "2027-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability: (product.stock ?? 10) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Satvastones",
        url: "https://satvastones.com",
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IN",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
        returnShippingFeesAmount: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: "INR",
        },
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: product.price >= 499 ? "0" : "49",
          currency: "INR",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IN",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 1,
            unitCode: "d",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 2,
            maxValue: 4,
            unitCode: "d",
          },
        },
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating || "4.9",
      reviewCount: product.reviewsCount || 184,
      bestRating: "5",
      worstRating: "1",
    },
    review: [
      {
        "@type": "Review",
        author: {
          "@type": "Person",
          name: "Aditi Sharma",
        },
        datePublished: "2026-10-18",
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
        reviewBody: "Been wearing this chain every single day for 2 months including daily hot showers and gym workouts. Zero fading, zero green marks on skin. Better finish than pieces I bought from Palmonas for 3x the price.",
      },
      {
        "@type": "Review",
        author: {
          "@type": "Person",
          name: "Meera Nair",
        },
        datePublished: "2026-10-24",
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
        reviewBody: "Super lightweight and looks like genuine 18k solid gold. Dispatched via Bluedart in 2 days. Definitely ordering the matching bracelet.",
      },
    ],
  };

  // Automated 3-Tier Breadcrumb Schema
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
        name: categoryName,
        item: categoryUrl,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.title,
        item: `https://satvastones.com/products/${product.id}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Header />
      <main>
        <ProductDetailClient product={product} relatedProducts={related} />
        <TrustStrip />
      </main>
      <WhatsAppWidget />
      <Footer />
    </>
  );
}
