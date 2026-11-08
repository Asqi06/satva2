// Next.js App Router Web App Manifest
export default function manifest() {
  return {
    name: 'Satvastones: Anti-Tarnish, Korean & Indian Demi-Fine Jewellery',
    short_name: 'Satvastones',
    description: 'Shop waterproof, anti-tarnish demi-fine jewellery in India. Korean minimalist aesthetics, daily wear western, and handcrafted Indian heritage.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FDFAF4',
    theme_color: '#B8860B',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/logo.png',
        sizes: '1024x314',
        type: 'image/png',
      },
    ],
  };
}
