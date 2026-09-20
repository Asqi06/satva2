import type { NextConfig } from "next";

// Strict CSP is applied in production only: dev (Turbopack/HMR) needs
// looser script/eval permissions. Baseline hardening headers always apply.
const PROD_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://res.cloudinary.com https://www.google-analytics.com",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://api.razorpay.com https://*.razorpay.com https://www.google-analytics.com https://cloudflareinsights.com",
  "frame-src 'self' https://api.razorpay.com https://*.razorpay.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
  "frame-ancestors 'self'",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Content-Security-Policy", value: PROD_CSP }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
