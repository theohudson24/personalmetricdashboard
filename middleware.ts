import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isEmailAllowed } from "@/lib/access";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { cookies: { getAll: () => request.cookies.getAll(), setAll(cookies) { cookies.forEach(({ name, value }) => request.cookies.set(name, value)); response = NextResponse.next({ request }); cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); } } });
  const { data } = await supabase.auth.getUser();
  const publicPath = request.nextUrl.pathname === "/login" || request.nextUrl.pathname.startsWith("/auth/") || request.nextUrl.pathname.startsWith("/legal/");
  const authorized = isEmailAllowed(data.user?.email, process.env.TEST_USER_EMAILS);
  if (!authorized && !publicPath) return NextResponse.redirect(new URL("/login", request.url));
  if (authorized && request.nextUrl.pathname === "/login") return NextResponse.redirect(new URL("/", request.url));
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
  response.headers.set("X-Frame-Options", "DENY");
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
