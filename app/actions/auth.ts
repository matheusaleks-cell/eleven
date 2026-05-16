"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type LoginResult =
  | { success: true; user: { id: string; name: string; email: string; role: string } }
  | { success: false; error: string };

export async function loginUser(email: string, password: string): Promise<LoginResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true, password: true },
    });

    if (!user) return { success: false, error: "Credenciais inválidas." };

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return { success: false, error: "Credenciais inválidas." };

    return {
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  } catch {
    return { success: false, error: "Erro interno ao autenticar." };
  }
}
