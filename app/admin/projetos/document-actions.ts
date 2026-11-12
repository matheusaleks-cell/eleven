"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth-guard";
import { stripLargeDocuments } from "@/lib/document-transfer-shared";

// Documentos do projeto (aba "Contratos & Anexos"). Antes nenhuma destas funções conferia login:
// qualquer um que chamasse a ação conseguia listar (com o conteúdo), enviar ou excluir documentos.
// O envio novo é em partes (app/actions/document-transfer.ts); esta função fica para arquivos
// pequenos e compatibilidade.

export async function uploadDocument(data: {
  name: string;
  type: string;
  category: string;
  size: string;
  base64Data: string;
  projectId: string;
  userId?: string | null;
}) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, error: "Não autorizado." };

  try {
    const document = await prisma.document.create({
      data: {
        name: data.name,
        type: data.type,
        category: data.category,
        size: data.size,
        base64Data: data.base64Data,
        projectId: data.projectId,
        userId: data.userId || null,
      },
      select: { id: true },
    });

    revalidatePath(`/admin/projetos/${data.projectId}`);
    return { success: true, document };
  } catch (error) {
    console.error("Erro ao fazer upload do documento:", error);
    return { success: false, error: "Falha ao gravar documento" };
  }
}

export async function getProjectDocuments(projectId: string) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, documents: [] };

  try {
    const documents = await prisma.document.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" }
    });

    return { success: true, documents: stripLargeDocuments(documents) };
  } catch (error) {
    console.error("Erro ao buscar documentos:", error);
    return { success: false, documents: [] };
  }
}

export async function deleteDocument(id: string, projectId: string) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, error: "Não autorizado." };

  try {
    await prisma.document.delete({
      where: { id }
    });

    revalidatePath(`/admin/projetos/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir documento:", error);
    return { success: false, error: "Falha ao excluir" };
  }
}
