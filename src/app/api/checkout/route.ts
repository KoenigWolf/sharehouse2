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
import { getServerTranslator } from "@/lib/i18n/server";

// Restrict to known payment flows to prevent abuse of checkout endpoint
const ALLOWED_PAYMENT_TYPES = ["event_fee", "deposit", "monthly_fee"] as const;
type PaymentType = (typeof ALLOWED_PAYMENT_TYPES)[number];

// Prevent micro-transaction abuse and unreasonably large charges
const MIN_AMOUNT = 100;
const MAX_AMOUNT = 1_000_000;

// Avoid double-charging users who click "Pay" multiple times
// NOTE: In-memory cache is not shared across serverless instances.
// For production, consider using Redis or DB-backed idempotency.
interface IdempotencyEntry {
  response: { sessionId: string; url: string | null };
  expiresAt: number;
}
const idempotencyCache = new Map<string, IdempotencyEntry>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_IDEMPOTENCY_ENTRIES = 10000;

function cleanupIdempotencyCache(): void {
  const now = Date.now();

  // TTL enforcement: free memory from completed transactions
  for (const [key, entry] of idempotencyCache.entries()) {
    if (entry.expiresAt < now) {
      idempotencyCache.delete(key);
    }
  }

  // Memory bound: prevent OOM in long-running instances
  if (idempotencyCache.size > MAX_IDEMPOTENCY_ENTRIES) {
    const keysToDelete = Array.from(idempotencyCache.keys()).slice(
      0,
      idempotencyCache.size - MAX_IDEMPOTENCY_ENTRIES
    );
    for (const key of keysToDelete) {
      idempotencyCache.delete(key);
    }
  }
}

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
  const t = await getServerTranslator();

  try {
    // Prevent CSRF: reject requests from untrusted origins
    const originError = validateApiOrigin(req, "checkout");
    if (originError) return originError;

    // Block content-type smuggling attacks
    const contentTypeError = validateJsonContentType(req);
    if (contentTypeError) return contentTypeError;

    // Throttle per-IP to prevent card-testing attacks that probe valid card numbers
    const rateLimitResult = RateLimiters.checkout(clientIp);
    if (!rateLimitResult.success) {
      auditLog({
        timestamp: new Date().toISOString(),
        eventType: AuditEventType.CHECKOUT_RATE_LIMITED,
        action: "Checkout rate limit exceeded",
        outcome: "failure",
        ipAddress: clientIp,
        metadata: { retryAfter: rateLimitResult.retryAfter, requestId },
      });
      return NextResponse.json(
        { error: formatRateLimitError(rateLimitResult.retryAfter, t) },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitResult.retryAfter),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.floor(rateLimitResult.resetTime / 1000)),
          },
        }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch (e) {
      if (e instanceof SyntaxError) {
        return NextResponse.json({ error: t("checkout.malformedJson") }, { status: 400 });
      }
      throw e;
    }
    const { type, amount, description, metadata, idempotencyKey } = body;

    // Return cached response to prevent duplicate charges from retry clicks
    if (idempotencyKey && typeof idempotencyKey === "string") {
      const cached = idempotencyCache.get(idempotencyKey);
      if (cached && cached.expiresAt > Date.now()) {
        return NextResponse.json(cached.response, {
          headers: { "Idempotency-Replayed": "true" },
        });
      }
    }

    // Only allow predefined payment flows, reject arbitrary type values
    if (!isValidPaymentType(type)) {
      return NextResponse.json(
        { error: t("checkout.invalidPaymentType") },
        { status: 400 }
      );
    }

    // Enforce business rules: no micro-transactions or unreasonable charges
    if (!isValidAmount(amount)) {
      return NextResponse.json(
        { error: t("checkout.invalidAmount", { min: MIN_AMOUNT.toLocaleString(), max: MAX_AMOUNT.toLocaleString() }) },
        { status: 400 }
      );
    }

    // Strip HTML to prevent XSS in Stripe-hosted checkout page
    const sanitizedDescription = description
      ? String(description).slice(0, 100).replace(/<[^>]*>/g, "")
      : getDefaultDescription(type, t);

    // Only redirect to trusted origins to prevent open redirect vulnerabilities
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

    // Limit metadata injection: only string values with bounded length
    // Reserved keys prevent user-supplied metadata from overwriting validated values
    const RESERVED_METADATA_KEYS = new Set(["type"]);
    const sanitizedMetadata: Record<string, string> = { type };
    if (metadata && typeof metadata === "object") {
      for (const [key, value] of Object.entries(metadata)) {
        if (RESERVED_METADATA_KEYS.has(key)) continue;
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

    const response = { sessionId: session.id, url: session.url };

    // Store successful session to return on retry (prevents duplicate charges)
    if (idempotencyKey && typeof idempotencyKey === "string") {
      cleanupIdempotencyCache();
      idempotencyCache.set(idempotencyKey, {
        response,
        expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
      });
    }

    return NextResponse.json(response);
  } catch (err) {
    logError(err, { action: "checkout", metadata: { requestId, clientIp } });
    return NextResponse.json(
      { error: t("checkout.sessionCreationFailed") },
      { status: 500, headers: { "X-Request-ID": requestId } }
    );
  }
}

function getDefaultDescription(type: PaymentType, t: Awaited<ReturnType<typeof getServerTranslator>>): string {
  switch (type) {
    case "event_fee":
      return t("checkout.defaultDescription.eventFee");
    case "deposit":
      return t("checkout.defaultDescription.deposit");
    case "monthly_fee":
      return t("checkout.defaultDescription.monthlyFee");
  }
}
