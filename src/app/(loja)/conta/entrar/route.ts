import { NextResponse } from "next/server";
import { authenticateCustomerWithMagicLink } from "@/lib/auth";

/**
 * Destino do link mágico enviado por e-mail: valida o token,
 * abre a sessão do cliente e leva para /conta.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";

  const result = await authenticateCustomerWithMagicLink(token);
  const destination = new URL(result.success ? "/conta" : "/conta?erro=link-invalido", url.origin);
  return NextResponse.redirect(destination);
}
