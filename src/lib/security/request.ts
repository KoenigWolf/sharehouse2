import { headers } from "next/headers";
import { validateOrigin } from "./validation";
import { getAllowedOrigins } from "./origin";
import { auditLog, AuditEventType } from "./audit";
import type { Translator } from "@/lib/i18n";

export async function getRequestOrigin(): Promise<string | null> {
  try {
    const headerStore = await headers();
    return headerStore.get("origin");
  } catch {
    return null;
  }
}

export async function getRequestHost(): Promise<string | null> {
  try {
    const headerStore = await headers();
    const forwardedHost = headerStore.get("x-forwarded-host");
    if (forwardedHost) {
      return forwardedHost.split(",")[0]?.trim() || null;
    }
    return headerStore.get("host");
  } catch {
    return null;
  }
}

export async function getRequestIp(): Promise<string | null> {
  try {
    const headerStore = await headers();
    const forwardedFor = headerStore.get("x-forwarded-for");
    if (forwardedFor) {
      return forwardedFor.split(",")[0]?.trim() || null;
    }
    return headerStore.get("x-real-ip") || headerStore.get("cf-connecting-ip");
  } catch {
    return null;
  }
}

export async function enforceAllowedOrigin(
  t: Translator,
  actionName: string
): Promise<string | null> {
  const origin = await getRequestOrigin();

  // No origin header = same-origin request (allowed)
  if (!origin) {
    return null;
  }

  const allowedOrigins = getAllowedOrigins();
  if (validateOrigin(origin, allowedOrigins)) {
    return null;
  }

  // Fallback: compare origin host with request host
  const host = await getRequestHost();
  if (host) {
    try {
      const originHost = new URL(origin).host;
      // Host header may or may not include port, normalize both
      const requestHost = host.includes("://")
        ? new URL(host).host
        : new URL(`http://${host}`).host;
      if (originHost === requestHost) {
        return null;
      }
    } catch {
      // Fall through to rejection below.
    }
  }

  // Development fallback: allow localhost origins in development
  if (process.env.NODE_ENV === "development") {
    try {
      const originUrl = new URL(origin);
      if (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1") {
        return null;
      }
    } catch {
      // Invalid URL, continue to rejection
    }
  }

  auditLog({
    timestamp: new Date().toISOString(),
    eventType: AuditEventType.SECURITY_UNAUTHORIZED_ACCESS,
    action: `Blocked ${actionName} from origin: ${origin}`,
    outcome: "failure",
  });
  return t("errors.forbidden");
}
