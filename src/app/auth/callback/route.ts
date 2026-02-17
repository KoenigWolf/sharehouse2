import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/env";
import { ALLOWED_REDIRECT_PATHS } from "@/lib/constants/config";

/**
 * Validate redirect URL to prevent open redirect attacks
 * Only allows relative paths starting with /
 */
function validateRedirect(redirect: string | null): string {
  if (!redirect) return "/";

  // Must be a relative path starting with /
  if (!redirect.startsWith("/")) return "/";

  // Prevent protocol-relative URLs (//evil.com)
  if (redirect.startsWith("//")) return "/";

  // Prevent encoded attacks
  try {
    const decoded = decodeURIComponent(redirect);
    if (decoded.startsWith("//") || decoded.includes("://")) return "/";
  } catch {
    // Invalid URL encoding
    return "/";
  }

  // Check if path starts with any allowed path
  const isAllowed = ALLOWED_REDIRECT_PATHS.some(
    (path) => redirect === path || redirect.startsWith(`${path}/`) || redirect.startsWith(`${path}?`)
  );

  return isAllowed ? redirect : "/";
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  const redirectTo = type === "recovery"
    ? "/auth/reset-password"
    : validateRedirect(requestUrl.searchParams.get("redirect"));

  let response = NextResponse.redirect(new URL(redirectTo, requestUrl));

  if (!code) {
    return response;
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
          response = NextResponse.redirect(new URL(redirectTo, requestUrl));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth", requestUrl));
  }

  return response;
}
