import { headers } from "next/headers";
import { validateOrigin } from "./validation";
import { getAllowedOrigins } from "./origin";
import type { Translator } from "@/lib/i18n";

export async function getRequestOrigin(): Promise<string | null> {
  try {
    const headerStore = await headers();
    return headerStore.get("origin");
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

  if (!origin) {
    return null;
  }

  const allowedOrigins = getAllowedOrigins();
  if (!validateOrigin(origin, allowedOrigins)) {
    console.warn(`[Security] Blocked ${actionName} from origin: ${origin}`);
    return t("errors.forbidden");
  }

  return null;
}
