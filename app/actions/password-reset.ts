"use server";

import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Resposta sempre genérica — nunca revela se o e-mail existe ou não na base
// (evita que alguém use este endpoint para descobrir quais e-mails têm conta).
const GENERIC_RESPONSE = {
  success: true,
  message: "Se esse e-mail estiver cadastrado, você vai receber um link de redefinição em instantes.",
};

export async function requestPasswordReset(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });
    if (!user) return GENERIC_RESPONSE;

    // Invalida qualquer link de redefinição anterior ainda válido antes de gerar um novo
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/redefinir-senha/${rawToken}`;

    await sendPasswordResetEmail(user.email, user.name, resetUrl);

    return GENERIC_RESPONSE;
  } catch (error) {
    console.error("Erro ao solicitar redefinição de senha:", error);
    return GENERIC_RESPONSE;
  }
}

export async function validateResetToken(token: string) {
  try {
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return { valid: false };
    }
    return { valid: true };
  } catch {
    return { valid: false };
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "A senha deve ter pelo menos 6 caracteres." };
    }

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: { select: { id: true, role: true } } },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return { success: false, error: "Link inválido ou expirado. Solicite uma nova redefinição." };
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { password: hashed } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);

    return { success: true, role: record.user.role };
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return { success: false, error: "Falha ao redefinir senha." };
  }
}
