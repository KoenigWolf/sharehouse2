import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/server";
import { logError } from "@/lib/errors";
import { validateApiOrigin, validateJsonContentType } from "@/lib/security/request";
import { getAllowedOrigins } from "@/lib/security/origin";

export async function POST(req: NextRequest) {
  try {
    // Security: Validate origin
    const originError = validateApiOrigin(req, "checkout");
    if (originError) return originError;

    // Security: Validate Content-Type
    const contentTypeError = validateJsonContentType(req);
    if (contentTypeError) return contentTypeError;

    const body = await req.json();
    const { type, amount, description, metadata } = body;

    if (!type || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use validated origin for redirect URLs (fallback to first allowed origin)
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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: description ?? getDefaultDescription(type),
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment/cancel`,
      metadata: {
        type,
        ...metadata,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    logError(err, { action: "checkout" });
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
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
