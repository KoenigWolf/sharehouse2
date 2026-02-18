import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthCallback = pathname.startsWith("/auth/callback");
  const isLoginPage = pathname.startsWith("/login");

  // 公開ページ（未認証でもアクセス可能、一部はマスク表示）
  const publicPages = [
    "/",
    "/concept",
    "/residents",
    "/contact",
    "/tour",
    "/payment",
    "/events",
    "/bulletin",
    "/share",
    "/tea-time",
    "/info",
    "/room-photos",
    "/floor-plan",
    "/stats",
    "/legal",
  ];
  const isPublicPage = publicPages.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`)
  );

  // 認証必須ページ（プロフィール編集、設定、管理画面）
  const authRequiredPages = ["/admin", "/settings", "/profile"];
  const isAuthRequired = authRequiredPages.some(
    (page) => pathname.startsWith(page)
  );

  // 未認証ユーザーの挙動（認証必須ページのみリダイレクト）
  if (!user && isAuthRequired) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 認証済みユーザーがログインページにアクセスした場合はホームへリダイレクト
  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
