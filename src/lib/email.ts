import { Resend } from "resend";
import { connectDb } from "./db";
import { requireServerVar } from "./env";
import { logger } from "./logger";
import { Notification, type NotificationType } from "@/models/Notification";
import { User } from "@/models/User";
import type { OrderDTO } from "@/services/order-service";
import {
  cancellationEmail,
  deliveredEmail,
  orderConfirmationEmail,
  outForDeliveryEmail,
  paymentReceiptEmail,
  refundEmail,
  shippedEmail,
  welcomeEmail,
  type EmailContent,
  type OrderEmailData,
} from "@/features/notifications/templates";

/**
 * Email delivery (Resend). `notify*` helpers never throw — failures are
 * recorded as FAILED notifications and logged, so business flows
 * (checkout, refunds) never break on email outages.
 */

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) resend = new Resend(requireServerVar("RESEND_API_KEY"));
  return resend;
}

function fromAddress(): string {
  return process.env.EMAIL_FROM ?? "SatvaStones <onboarding@resend.dev>";
}

async function record(
  userId: string | undefined,
  type: NotificationType,
  to: string,
  subject: string,
  status: "SENT" | "FAILED",
  error?: string,
): Promise<void> {
  try {
    await connectDb();
    await Notification.create({ userId, type, channel: "EMAIL", to, subject, status, error });
  } catch (dbError) {
    logger.error("notification log failed", {
      type,
      message: dbError instanceof Error ? dbError.message : "unknown",
    });
  }
}

/** Send with one immediate retry, then record FAILED. Never throws. */
async function deliver(
  userId: string | undefined,
  type: NotificationType,
  to: string,
  content: EmailContent,
): Promise<void> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await getResend().emails.send({
        from: fromAddress(),
        to,
        subject: content.subject,
        html: content.html,
        text: content.text,
      });
      await record(userId, type, to, content.subject, "SENT");
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      if (attempt === 2) {
        logger.error("email delivery failed", { type, to, message });
        await record(userId, type, to, content.subject, "FAILED", message);
      }
    }
  }
}

function orderData(order: OrderDTO, customerName: string): OrderEmailData {
  return {
    shortId: order.id.slice(-8).toUpperCase(),
    customerName,
    items: order.items,
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    total: order.total,
    couponCode: order.couponCode,
    city: order.address.city,
    pincode: order.address.pincode,
    eta: "5–7 days",
  };
}

async function recipient(userId: string): Promise<{ email: string; name: string } | null> {
  await connectDb();
  const user = await User.findById(userId).select("email name").lean();
  if (!user?.email) return null;
  return { email: user.email, name: user.name ?? "there" };
}

export async function notifyWelcome(email: string, name: string): Promise<void> {
  await deliver(undefined, "WELCOME", email, welcomeEmail(name));
}

async function notifyOrderKind(
  type: NotificationType,
  userId: string,
  order: OrderDTO,
  build: (data: OrderEmailData) => EmailContent,
  reason?: string,
): Promise<void> {
  const to = await recipient(userId);
  if (!to) {
    logger.warn("email skipped: no recipient", { type, userId });
    return;
  }
  const data = orderData(order, to.name);
  if (reason !== undefined) data.reason = reason;
  await deliver(userId, type, to.email, build(data));
}

export async function notifyOrderConfirmation(userId: string, order: OrderDTO): Promise<void> {
  await notifyOrderKind("ORDER_CONFIRMATION", userId, order, orderConfirmationEmail);
}

export async function notifyPaymentReceipt(userId: string, order: OrderDTO): Promise<void> {
  await notifyOrderKind("PAYMENT_RECEIPT", userId, order, paymentReceiptEmail);
}

export async function notifyShipped(userId: string, order: OrderDTO): Promise<void> {
  await notifyOrderKind("SHIPPED", userId, order, shippedEmail);
}

export async function notifyOutForDelivery(userId: string, order: OrderDTO): Promise<void> {
  await notifyOrderKind("OUT_FOR_DELIVERY", userId, order, outForDeliveryEmail);
}

export async function notifyDelivered(userId: string, order: OrderDTO): Promise<void> {
  await notifyOrderKind("DELIVERED", userId, order, deliveredEmail);
}

export async function notifyCancellation(userId: string, order: OrderDTO, reason?: string): Promise<void> {
  await notifyOrderKind("CANCELLATION", userId, order, cancellationEmail, reason);
}

export async function notifyRefund(userId: string, order: OrderDTO, reason?: string): Promise<void> {
  await notifyOrderKind("REFUND", userId, order, refundEmail, reason);
}
