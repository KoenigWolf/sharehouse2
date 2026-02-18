import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/server";
import { logError } from "@/lib/errors";
import {
  validateApiOrigin,
  validateJsonContentType,
  getApiClientIp,
  getApiRequestId,
} from "@/lib/security/request";
import { getAllowedOrigins } from "@/lib/security/origin";
import { RateLimiters, formatRateLimitError } from "@/lib/security/rate-limit";
import { auditLog, AuditEventType } from "@/lib/security/audit";

// Allowed payment types (whitelist)
const ALLOWED_PAYMENT_TYPES = ["event_fee", "deposit", "monthly_fee"] as const;
type PaymentType = (typeof ALLOWED_PAYMENT_TYPES)[number];

// Amount limits (in JPY)
const MIN_AMOUNT = 100;
const MAX_AMOUNT = 1_000_000;

function isValidPaymentType(type: unknown): type is PaymentType {
  return typeof type === "string" && ALLOWED_PAYMENT_TYPES.includes(type as PaymentType);
}

function isValidAmount(amount: unknown): amount is number {
  return (
    typeof amount === "number" &&
    Number.isInteger(amount) &&
    amount >= MIN_AMOUNT &&
    amount <= MAX_AMOUNT
  );
}

export async function POST(req: NextRequest) {
  const clientIp = getApiClientIp(req);
  const requestId = getApiRequestId(req);

  try {
    // Security: Validate origin
    const originError = validateApiOrigin(req, "checkout");
    if (originError) return originError;

    // Security: Validate Content-Type
    const contentTypeError = validateJsonContentType(req);
    if (contentTypeError) return contentTypeError;

    // Security: Rate limiting (prevent card testing attacks)
    const rateLimitResult = RateLimiters.checkout(clientIp);
    if (!rateLimitResult.success) {
      auditLog({
        timestamp: new Date().toISOString(),
        eventType: AuditEventType.AUTH_RATE_LIMITED,
        action: "Checkout rate limit exceeded",
        outcome: "failure",
        ipAddress: clientIp,
        metadata: { retryAfter: rateLimitResult.retryAfter, requestId },
      });
      return NextResponse.json(
        { error: formatRateLimitError(rateLimitResult.retryAfter) },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitResult.retryAfter),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimitResult.resetTime),
          },
        }
      );
    }

    const body = await req.json();
    const { type, amount, description, metadata } = body;

    // Security: Validate payment type (whitelist)
    if (!isValidPaymentType(type)) {
      return NextResponse.json(
        { error: "Invalid payment type" },
        { status: 400 }
      );
    }

    // Security: Validate amount (range check)
    if (!isValidAmount(amount)) {
      return NextResponse.json(
        { error: `Amount must be between ¥${MIN_AMOUNT} and ¥${MAX_AMOUNT.toLocaleString()}` },
        { status: 400 }
      );
    }

    // Security: Sanitize description (max length, no HTML)
    const sanitizedDescription = description
      ? String(description).slice(0, 100).replace(/<[^>]*>/g, "")
      : getDefaultDescription(type);

    // Use validated origin for redirect URLs
    const requestOrigin = req.headers.get("origin");
    const allowedOrigins = getAllowedOrigins();
    const origin = requestOrigin && allowedOrigins.some(o => {
      try {
        return new URL(o).host === new URL(requestOrigin).host;
      } catch {
        return false;
      }
    }) ? requestOrigin : allowedOrigins[0] ?? "http://localhost:3000";

    const stripe = getStripe();

    // Security: Sanitize metadata (only allow string values)
    const sanitizedMetadata: Record<string, string> = { type };
    if (metadata && typeof metadata === "object") {
      for (const [key, value] of Object.entries(metadata)) {
        if (typeof value === "string" && key.length <= 40 && value.length <= 500) {
          sanitizedMetadata[key.slice(0, 40)] = value.slice(0, 500);
        }
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: sanitizedDescription,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment/cancel`,
      metadata: sanitizedMetadata,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    logError(err, { action: "checkout", metadata: { requestId, clientIp } });
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500, headers: { "X-Request-ID": requestId } }
    );
  }
}

function getDefaultDescription(type: string): string {
  switch (type) {
    case "event_fee":
      return "イベント参加費";
    case "deposit":
      return "入居申込金";
    default:
      return "お支払い";
  }
}
