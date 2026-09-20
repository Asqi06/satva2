/**
 * Transactional email templates (Resend). Pure functions — snapshot-tested.
 * Never include secrets, payment ids, or full addresses beyond city+pincode.
 */

export interface OrderEmailData {
  shortId: string;
  customerName: string;
  items: { name: string; variantSku?: string; qty: number; unitPrice: number; totalPrice: number }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode?: string;
  city: string;
  pincode: string;
  eta: string;
  reason?: string;
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

function money(rupees: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

function shell(title: string, body: string): string {
  return `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1512">` +
    `<p style="font-size:22px;margin:0 0 4px">SatvaStones</p>` +
    `<h1 style="font-size:26px;margin:0 0 16px">${title}</h1>` +
    body +
    `<p style="font-size:13px;color:#6b6259;margin-top:24px">Questions? Reply to this email — a human reads every one.<br/>SatvaStones · Vapi, Gujarat</p></div>`;
}

function itemsTable(items: OrderEmailData["items"]): string {
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${i.name}${i.variantSku ? ` · ${i.variantSku}` : ""} × ${i.qty}</td>` +
        `<td style="padding:6px 0;text-align:right">${money(i.totalPrice)}</td></tr>`,
    )
    .join("");
  return `<table style="width:100%;font-size:14px;border-collapse:collapse">${rows}</table>`;
}

function totals(data: OrderEmailData): string {
  const lines = [
    `<tr><td>Subtotal</td><td style="text-align:right">${money(data.subtotal)}</td></tr>`,
    data.discount > 0
      ? `<tr><td>Discount${data.couponCode ? ` (${data.couponCode})` : ""}</td><td style="text-align:right">−${money(data.discount)}</td></tr>`
      : "",
    `<tr><td>Shipping</td><td style="text-align:right">${data.shipping === 0 ? "Free" : money(data.shipping)}</td></tr>`,
    `<tr><td><strong>Total paid</strong></td><td style="text-align:right"><strong>${money(data.total)}</strong></td></tr>`,
  ].join("");
  return `<table style="width:100%;font-size:14px;border-collapse:collapse;margin-top:8px">${lines}</table>`;
}

export function welcomeEmail(name: string): EmailContent {
  const subject = "Welcome to SatvaStones ✳";
  const text =
    `Hi ${name},\n\nWelcome to SatvaStones — everyday jewellery, made to gift. ` +
    `Your wishlist, bag and orders now sync across devices.\n\nPretty things await,\nTeam SatvaStones`;
  return {
    subject,
    text,
    html: shell(
      `Welcome, ${name}.`,
      `<p>Everyday jewellery, made to gift. Your wishlist, bag and orders now sync across devices.</p>` +
        `<p><a href="https://satvastones.in/shop">Start browsing →</a></p>`,
    ),
  };
}

export function orderConfirmationEmail(data: OrderEmailData): EmailContent {
  const subject = `Order ${data.shortId} received`;
  const text =
    `Hi ${data.customerName},\n\nWe have your order ${data.shortId}:\n` +
    data.items.map((i) => `• ${i.name} × ${i.qty} — ${money(i.totalPrice)}`).join("\n") +
    `\nTotal: ${money(data.total)}\nDelivering to ${data.city} ${data.pincode} in ${data.eta}.\n\nTeam SatvaStones`;
  return {
    subject,
    text,
    html: shell(
      `We have your order.`,
      `<p>Hi ${data.customerName} — order <strong>${data.shortId}</strong> is in.</p>` +
        itemsTable(data.items) +
        totals(data) +
        `<p>Delivering to ${data.city} ${data.pincode} in ${data.eta}.</p>`,
    ),
  };
}

export function paymentReceiptEmail(data: OrderEmailData): EmailContent {
  const subject = `Payment received for ${data.shortId}`;
  const text =
    `Hi ${data.customerName},\n\nPayment of ${money(data.total)} for order ${data.shortId} is confirmed. ` +
    `Your pieces move to packing next.\n\nTeam SatvaStones`;
  return {
    subject,
    text,
    html: shell(
      `Payment confirmed.`,
      `<p>Hi ${data.customerName} — <strong>${money(data.total)}</strong> received for order <strong>${data.shortId}</strong>. Your pieces move to packing next.</p>` +
        totals(data),
    ),
  };
}

export function shippedEmail(data: OrderEmailData): EmailContent {
  const subject = `Order ${data.shortId} has shipped`;
  const text = `Hi ${data.customerName},\n\nGood news — order ${data.shortId} left our studio and reaches ${data.city} ${data.pincode} in ${data.eta}.\n\nTeam SatvaStones`;
  return {
    subject,
    text,
    html: shell(
      `On its way.`,
      `<p>Hi ${data.customerName} — order <strong>${data.shortId}</strong> left our studio, headed to ${data.city} ${data.pincode}.</p>`,
    ),
  };
}

export function outForDeliveryEmail(data: OrderEmailData): EmailContent {
  const subject = `Arriving today: order ${data.shortId}`;
  const text = `Hi ${data.customerName},\n\nOrder ${data.shortId} is out for delivery in ${data.city} — keep your phone handy.\n\nTeam SatvaStones`;
  return {
    subject,
    text,
    html: shell(
      `Arriving today.`,
      `<p>Hi ${data.customerName} — order <strong>${data.shortId}</strong> is out for delivery. Keep your phone handy.</p>`,
    ),
  };
}

export function deliveredEmail(data: OrderEmailData): EmailContent {
  const subject = `Delivered ✳ order ${data.shortId}`;
  const text =
    `Hi ${data.customerName},\n\nOrder ${data.shortId} was delivered. Wear them well — and if you love them, ` +
    `a review makes our week.\n\nTeam SatvaStones`;
  return {
    subject,
    text,
    html: shell(
      `Delivered. Wear them well.`,
      `<p>Hi ${data.customerName} — order <strong>${data.shortId}</strong> was delivered. If you love your pieces, a review makes our week.</p>`,
    ),
  };
}

export function cancellationEmail(data: OrderEmailData): EmailContent {
  const subject = `Order ${data.shortId} cancelled`;
  const text =
    `Hi ${data.customerName},\n\nOrder ${data.shortId} is cancelled${data.reason ? `: ${data.reason}` : ""}. ` +
    `No money was taken${data.total > 0 ? " — paid orders are refunded automatically" : ""}.\n\nTeam SatvaStones`;
  return {
    subject,
    text,
    html: shell(
      `Cancelled, no hard feelings.`,
      `<p>Hi ${data.customerName} — order <strong>${data.shortId}</strong> is cancelled${data.reason ? `: ${data.reason}` : ""}.</p>`,
    ),
  };
}

export function refundEmail(data: OrderEmailData): EmailContent {
  const subject = `Refund issued for ${data.shortId}`;
  const text =
    `Hi ${data.customerName},\n\n${money(data.total)} for order ${data.shortId} is on its way back ` +
    `to your original payment method (5–7 working days).\n\nTeam SatvaStones`;
  return {
    subject,
    text,
    html: shell(
      `Refund on its way.`,
      `<p>Hi ${data.customerName} — <strong>${money(data.total)}</strong> for order <strong>${data.shortId}</strong> is returning to your original payment method (5–7 working days).</p>`,
    ),
  };
}
