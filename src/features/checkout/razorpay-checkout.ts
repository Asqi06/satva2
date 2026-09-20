/**
 * Razorpay Checkout.js loader + minimal typings (no `any`).
 * https://checkout.razorpay.com/v1/checkout.js
 */

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss: () => void };
}

export interface RazorpayCheckoutInstance {
  open: () => void;
  close: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;
  }
}

let loading: Promise<void> | null = null;

/** Inject Checkout.js once; resolves when `window.Razorpay` is ready. */
export function loadRazorpay(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Browser only"));
  if (window.Razorpay) return Promise.resolve();
  if (!loading) {
    loading = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        if (window.Razorpay) resolve();
        else {
          loading = null;
          reject(new Error("Razorpay failed to load"));
        }
      };
      script.onerror = () => {
        loading = null;
        reject(new Error("Razorpay failed to load"));
      };
      document.body.appendChild(script);
    });
  }
  return loading;
}
