"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function uploadDocument(data: {
  name: string;
  type: string;
  category: string;
  size: string;
  base64Data: string;
  projectId: string;
  userId?: string | null;
}) {
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
      }
    });
    
    revalidatePath(`/admin/projetos/${data.projectId}`);
    return { success: true, document };
  } catch (error) {
    console.error("Erro ao fazer upload do documento:", error);
    return { success: false, error: "Falha ao gravar documento" };
  }
}

export async function getProjectDocuments(projectId: string) {
  try {
    const documents = await prisma.document.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" }
    });
    
    return { success: true, documents };
  } catch (error) {
    console.error("Erro ao buscar documentos:", error);
    return { success: false, documents: [] };
  }
}

export async function deleteDocument(id: string, projectId: string) {
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
