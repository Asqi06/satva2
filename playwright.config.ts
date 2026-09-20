import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:3100",
  },
  // E2E runs against `scripts/e2e-dev.mjs`: Next dev + throwaway
  // in-memory Mongo, so DB-backed routes work without touching real data.
  // Port 3100: localhost:3000 is occupied by an unrelated server (C:\satvastones).
  // reuseExistingServer is false so a port collision fails loudly instead of
  // silently testing the wrong app.
  webServer: {
    command: "node scripts/e2e-dev.mjs",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 180000,
    // Dummy secrets: enough for JWT verification + guard redirects.
    // Live Google OAuth is a manual acceptance step (see docs/ACCEPTANCE_CRITERIA.md).
    env: {
      AUTH_SECRET: "e2e-test-secret-not-for-production",
      GOOGLE_CLIENT_ID: "e2e-dummy-id",
      GOOGLE_CLIENT_SECRET: "e2e-dummy-secret",
      NEXT_PUBLIC_APP_URL: "http://localhost:3100",
      E2E_SEED_SECRET: "e2e-seed-secret",
      RAZORPAY_KEY_ID: "rzp_test_e2e",
      RAZORPAY_KEY_SECRET: "e2e-rzp-secret",
      RAZORPAY_WEBHOOK_SECRET: "e2e-webhook-secret",
    },
  },
});
