// Next.js App Router sitemap.xml generator
import { getLiveCatalog } from '../lib/catalog';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://satvastones.com';
  const products = await getLiveCatalog();

  // Core landing and collection pages
  const staticPages = [
    {
      url: `${baseUrl}`,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/anti-tarnish-jewellery`,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/waterproof-jewellery`,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/korean-jewellery`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/western-jewellery`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/indian-jewellery`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sale`,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/journal`,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/jewellery-care`,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
  ];

  // Dynamic Product URLs with Google Image Search discoverability
  const productPages = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug || product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
    images: product.image ? [product.image] : [],
  }));

  return [...staticPages, ...productPages];
}
