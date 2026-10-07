import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyToken } from "@/lib/session";

/**
 * Barreira de entrada do painel /admin (P-007).
 * Sem sessão administrativa válida, qualquer rota /admin redireciona para /admin/login.
 * As páginas e Server Actions continuam chamando requireAdmin() no servidor.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await verifyToken(token, { role: "ADMIN", purpose: "session" });

  if (!session) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
