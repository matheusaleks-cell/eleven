"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

// ─── LISTAGEM ───────────────────────────────────────────────────────────────

export async function getInvestors() {
  try {
    const investors = await prisma.user.findMany({
      where: { role: "INVESTOR" },
      include: {
        investedProjects: {
          include: {
            cycles: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return investors.map((i) => {
      const totalInvested = i.investedProjects.reduce(
        (acc, p) => acc + (p.initialCapital || 0),
        0
      );
      let totalReceived = 0;
      i.investedProjects.forEach((p) => {
        p.cycles.forEach((c) => {
          totalReceived += c.investorShare || 0;
        });
      });

      return {
        ...i,
        totalInvested,
        totalReceived,
        projectsCount: i.investedProjects.length,
        status: i.investedProjects.some((p) => p.status === "ACTIVE")
          ? "ATIVO"
          : "INATIVO",
      };
    });
  } catch (error) {
    console.error("Erro ao buscar investidores:", error);
    return [];
  }
}

// ─── DETALHES ────────────────────────────────────────────────────────────────

export async function getInvestorDetails(id: string) {
  try {
    const investor = await prisma.user.findUnique({
      where: { id },
      include: {
        investedProjects: {
          include: {
            cycles: { orderBy: { cycleNumber: "asc" } },
          },
        },
        documents: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!investor) return null;

    let totalInvested = 0;
    let totalReceived = 0;
    let totalCicles = 0;

    const mappedProjects = investor.investedProjects.map((p) => {
      totalInvested += p.initialCapital;
      let projectReceived = 0;
      p.cycles.forEach((c) => {
        if (c.status === "COMPLETED") {
          totalReceived += c.investorShare;
          projectReceived += c.investorShare;
          totalCicles++;
        }
      });
      return {
        id: p.id,
        name: p.name,
        product_name: p.productName,
        currentCycle: p.cycles.length,
        max_cycles: p.maxCycles,
        currentCapital: p.initialCapital + projectReceived,
        status: p.status,
      };
    });

    return {
      id: investor.id,
      name: investor.name,
      email: investor.email,
      phone: investor.phone || "",
      createdAt: investor.createdAt.toISOString(),
      cpfCnpj: investor.cpfCnpj || "",
      rg: investor.rg || "",
      address: investor.address || "",
      bankDetails: investor.bankDetails || "",
      bankReferences: investor.bankReferences || "",
      commercialRefs: investor.commercialRefs || "",
      profession: investor.profession || "",
      stats: {
        totalInvested,
        totalReceived,
        roi:
          totalInvested > 0
            ? ((totalReceived - totalInvested) / totalInvested) * 100
            : 0,
        activeProjects: investor.investedProjects.length,
        totalCycles: totalCicles,
      },
      projects: mappedProjects,
      documents: investor.documents.map((d) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        category: d.category,
        size: d.size,
        createdAt: d.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Erro ao buscar detalhes do investidor:", error);
    return null;
  }
}

// ─── CRIAÇÃO ─────────────────────────────────────────────────────────────────

export async function createInvestor(data: {
  // Conta
  name: string;
  email: string;
  password: string;
  phone?: string;
  // Pessoal
  cpfCnpj?: string;
  rg?: string;
  profession?: string;
  // Endereço (gravado em JSON dentro do campo address)
  address?: string;
  // Bancário (gravado em JSON dentro do campo bankDetails)
  bankDetails?: string;
  // Referências
  bankReferences?: string;
  commercialRefs?: string;
}) {
  try {
    const investor = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        password: data.password,
        role: "INVESTOR",
        cpfCnpj: data.cpfCnpj || null,
        rg: data.rg || null,
        profession: data.profession || null,
        address: data.address || null,
        bankDetails: data.bankDetails || null,
        bankReferences: data.bankReferences || null,
        commercialRefs: data.commercialRefs || null,
      },
    });
    revalidatePath("/admin/investidores");
    return { success: true, investor };
  } catch (error) {
    console.error("Erro ao criar investidor:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          success: false,
          error: "Este e-mail já está cadastrado para outro usuário.",
        };
      }
    }
    return { success: false, error: "Erro interno ao cadastrar investidor." };
  }
}

// ─── ATUALIZAÇÃO ─────────────────────────────────────────────────────────────

export async function updateInvestor(id: string, data: any) {
  try {
    await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        cpfCnpj: data.cpfCnpj,
        rg: data.rg,
        address: data.address,
        bankDetails: data.bankDetails,
        bankReferences: data.bankReferences,
        commercialRefs: data.commercialRefs,
        profession: data.profession,
      },
    });
    revalidatePath(`/admin/investidores/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar investidor:", error);
    return { success: false, error: "Erro ao atualizar dados do investidor." };
  }
}

// ─── UPLOAD DE DOCUMENTO ─────────────────────────────────────────────────────

export async function uploadInvestorDocument(data: {
  userId: string;
  name: string;
  type: string;
  category: string;
  size: string;
  base64Data: string;
}) {
  try {
    const document = await prisma.document.create({
      data: {
        name: data.name,
        type: data.type,
        category: data.category,
        size: data.size,
        base64Data: data.base64Data,
        userId: data.userId,
      },
    });
    revalidatePath(`/admin/investidores/${data.userId}`);
    return { success: true, document };
  } catch (error) {
    console.error("Erro ao fazer upload do documento:", error);
    return { success: false, error: "Falha ao gravar documento." };
  }
}

// ─── DELETAR DOCUMENTO ───────────────────────────────────────────────────────

export async function deleteInvestorDocument(
  documentId: string,
  userId: string
) {
  try {
    await prisma.document.delete({ where: { id: documentId } });
    revalidatePath(`/admin/investidores/${userId}`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir documento:", error);
    return { success: false, error: "Falha ao excluir documento." };
  }
}

// ─── BUSCAR DOCUMENTOS DO INVESTIDOR ─────────────────────────────────────────

export async function getInvestorDocuments(userId: string) {
  try {
    const documents = await prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, documents };
  } catch (error) {
    console.error("Erro ao buscar documentos:", error);
    return { success: false, documents: [] };
  }
}

// ─── DELETAR PROJETO ─────────────────────────────────────────────────────────

export async function deleteInvestorProject(projectId: string) {
  try {
    const project = await prisma.investmentProject.findUnique({
      where: { id: projectId },
    });
    if (!project) return { success: false, error: "Projeto não encontrado." };
    await prisma.investmentProject.delete({ where: { id: projectId } });
    revalidatePath(`/admin/investidores/${project.investorId}`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar projeto:", error);
    return { success: false, error: "Erro ao deletar projeto de investimento." };
  }
}

// ─── ATUALIZAR SENHA ──────────────────────────────────────────────────────────

export async function updateInvestorPassword(userId: string, newPassword: string) {
  try {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "A senha deve ter pelo menos 6 caracteres." };
    }
    await prisma.user.update({
      where: { id: userId },
      data: { password: newPassword },
    });
    revalidatePath(`/admin/investidores/${userId}`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar senha:", error);
    return { success: false, error: "Erro ao atualizar senha do investidor." };
  }
}
