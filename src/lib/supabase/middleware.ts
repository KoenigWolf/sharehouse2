import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  const isResidentsPage = pathname.startsWith("/residents");
  const isLoginPage = pathname.startsWith("/login");

  // 未認証ユーザーの挙動
  if (!user && !isLoginPage && !isAuthCallback && !isResidentsPage) {
    const url = request.nextUrl.clone();

    // ルートパスへのアクセスの場合は /residents (チラ見せ) へ
    if (pathname === "/") {
      url.pathname = "/residents";
    } else {
      url.pathname = "/login";
    }

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
