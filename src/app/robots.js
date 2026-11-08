// Next.js App Router robots.txt generator
export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://satvastones.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/cart', '/checkout', '/account', '/wishlist', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
