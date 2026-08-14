import "server-only";

import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

/**
 * Verifica a sessão real do NextAuth no servidor (nunca confie em dados vindos do cliente,
 * como localStorage ou parâmetros de função, para decisões de autorização).
 *
 * Retorna a sessão quando o usuário está autenticado e, se `role` for informado, quando
 * o papel do usuário confere. Retorna `null` em qualquer outro caso — quem chamar deve
 * tratar esse `null` como "não autorizado" e responder de acordo com o padrão de erro
 * já usado no arquivo (ex.: `{ success: false, error: "Não autorizado." }`, `null` ou `[]`).
 */
export async function requireSession(role?: "ADMIN" | "INVESTOR"): Promise<Session | null> {
  const session = await auth();

  if (!session?.user?.email) return null;
  if (role && session.user.role !== role) return null;

  return session;
}
