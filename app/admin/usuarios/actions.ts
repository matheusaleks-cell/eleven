"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth-guard";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

// Todos os usuários da plataforma (admins + investidores), direto do Turso via Prisma.
export async function getAllUsers() {
  const session = await requireSession("ADMIN");
  if (!session) return [];

  try {
    return await prisma.user.findMany({
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return [];
  }
}

// Cria um novo usuário ADMIN (investidor tem cadastro proprio, mais completo, em /admin/investidores/novo).
export async function createAdminUser(data: { name: string; email: string; password: string; phone?: string }) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, error: "Não autorizado." };

  try {
    if (!data.name || !data.email || !data.password) {
      return { success: false, error: "Nome, e-mail e senha são obrigatórios." };
    }
    if (data.password.length < 6) {
      return { success: false, error: "A senha deve ter pelo menos 6 caracteres." };
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: "ADMIN",
        phone: data.phone || null,
      },
    });

    revalidatePath("/admin/usuarios");
    return { success: true, user };
  } catch (error) {
    console.error("Erro ao criar usuário administrador:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, error: "Este e-mail já está cadastrado no sistema." };
    }
    return { success: false, error: "Erro interno ao cadastrar usuário." };
  }
}

// Atualiza os dados basicos de identidade (validos pra qualquer role) - dados extras de investidor
// (CPF, banco, documentos) continuam em /admin/investidores/[id].
export async function updateUserBasicInfo(id: string, data: { name: string; email: string; phone?: string }) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, error: "Não autorizado." };

  try {
    await prisma.user.update({
      where: { id },
      data: { name: data.name, email: data.email, phone: data.phone || null },
    });
    revalidatePath("/admin/usuarios");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, error: "Este e-mail já está em uso por outra conta." };
    }
    return { success: false, error: "Erro ao atualizar usuário." };
  }
}

export async function updateUserPassword(id: string, newPassword: string) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, error: "Não autorizado." };

  try {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "A senha deve ter pelo menos 6 caracteres." };
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id }, data: { password: hashedPassword } });
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar senha do usuário:", error);
    return { success: false, error: "Erro ao atualizar senha." };
  }
}

export async function deleteUser(id: string) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, error: "Não autorizado." };

  try {
    if (session.user.id === id) {
      return { success: false, error: "Você não pode excluir a própria conta." };
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!target) return { success: false, error: "Usuário não encontrado." };

    if (target.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return { success: false, error: "Não é possível excluir o último administrador do sistema." };
      }
    } else {
      const projectsCount = await prisma.investmentProject.count({ where: { investorId: id } });
      if (projectsCount > 0) {
        return { success: false, error: "Este investidor possui projetos vinculados e não pode ser excluído diretamente. Exclua os projetos primeiro." };
      }
      await prisma.document.deleteMany({ where: { userId: id } });
    }

    await prisma.user.delete({ where: { id } });
    revalidatePath("/admin/usuarios");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return {
      success: false,
      error: "Este usuário possui vendas ou registros vinculados e não pode ser excluído diretamente.",
    };
  }
}
