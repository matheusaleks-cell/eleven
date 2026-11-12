"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { DOC_CHUNK_CHARS } from "@/lib/document-transfer-shared";
import { CATEGORY_TO_STAGE } from "@/lib/import-stages";

// Envio/download de documentos em partes. A hospedagem (Netlify) limita cada requisição/
// resposta a ~6 MB, e o arquivo vai como data URL base64 (≈ +33%): sem partes, PDFs a partir
// de ~4,5 MB simplesmente não subiam, e um documento grande quebraria qualquer lista que o
// carregasse inteiro.

const MAX_TOTAL_CHARS = 36_000_000; // ≈ 25 MB de arquivo

export async function beginProjectDocumentUpload(meta: {
  projectId: string;
  name: string;
  type: string;
  category: string;
  size: string;
  totalChars: number;
  firstChunk: string;
}) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false as const, error: "Não autorizado." };
  if (!meta.name?.trim()) return { success: false as const, error: "Arquivo sem nome." };
  if (!Number.isFinite(meta.totalChars) || meta.totalChars <= 0 || meta.totalChars > MAX_TOTAL_CHARS) {
    return { success: false as const, error: "Arquivo acima do limite de 25 MB." };
  }
  if (!meta.firstChunk || meta.firstChunk.length > DOC_CHUNK_CHARS + 1024) {
    return { success: false as const, error: "Parte do arquivo inválida." };
  }

  try {
    const project = await prisma.investmentProject.findUnique({
      where: { id: meta.projectId },
      select: { id: true, investorId: true },
    });
    if (!project) return { success: false as const, error: "Projeto não encontrado." };

    const doc = await prisma.document.create({
      data: {
        name: meta.name.trim(),
        type: meta.type,
        category: meta.category,
        size: meta.size,
        base64Data: meta.firstChunk,
        projectId: project.id,
        userId: project.investorId,
      },
      select: { id: true },
    });
    return { success: true as const, id: doc.id };
  } catch (error) {
    console.error("Erro ao iniciar upload do documento:", error);
    return { success: false as const, error: "Falha ao gravar o documento." };
  }
}

export async function appendDocumentChunk(id: string, chunk: string, expectedLengthBefore: number) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false as const, error: "Não autorizado." };
  if (!chunk || chunk.length > DOC_CHUNK_CHARS + 1024) return { success: false as const, error: "Parte do arquivo inválida." };

  try {
    // Só anexa se o que já está gravado tem o tamanho esperado (evita parte duplicada/fora de ordem).
    const updated = await prisma.$executeRaw`
      UPDATE documents SET "base64Data" = "base64Data" || ${chunk}
      WHERE id = ${id} AND LENGTH("base64Data") = ${expectedLengthBefore} AND LENGTH("base64Data") + ${chunk.length} <= ${MAX_TOTAL_CHARS}`;
    if (updated !== 1) return { success: false as const, error: "Falha ao gravar parte do arquivo." };
    return { success: true as const };
  } catch (error) {
    console.error("Erro ao gravar parte do documento:", error);
    return { success: false as const, error: "Falha ao gravar parte do arquivo." };
  }
}

// Envio incompleto (falhou no meio): apaga o registro parcial para não ficar arquivo corrompido.
export async function abortDocumentUpload(id: string) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false as const };
  try {
    await prisma.document.delete({ where: { id } });
  } catch {}
  return { success: true as const };
}

export async function finishProjectDocumentUpload(id: string, totalChars: number) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false as const, error: "Não autorizado." };
  const rows = await prisma.$queryRaw<{ len: number | bigint; project_id: string | null }[]>`
    SELECT LENGTH("base64Data") AS len, project_id FROM documents WHERE id = ${id}`;
  const row = rows[0];
  if (!row || Number(row.len) !== totalChars) return { success: false as const, error: "Arquivo incompleto." };
  if (row.project_id) {
    revalidatePath(`/admin/projetos/${row.project_id}`);
    revalidatePath("/investidor/documentos");
  }
  revalidatePath("/admin/importacao/lotes");
  return { success: true as const };
}

// Download em partes. Admin vê tudo; investidor só documento dele (ou de projeto dele).
export async function getDocumentChunk(id: string, index: number) {
  const session = await requireSession();
  if (!session) return { success: false as const, error: "Não autorizado." };

  const doc = await prisma.document.findUnique({
    where: { id },
    select: { userId: true, project: { select: { investor: { select: { email: true } } } } },
  });
  if (!doc) return { success: false as const, error: "Documento não encontrado." };
  if (session.user.role !== "ADMIN") {
    const isOwner =
      (doc.userId && doc.userId === (session.user as any).id) ||
      (doc.project?.investor?.email && doc.project.investor.email === session.user.email);
    if (!isOwner) return { success: false as const, error: "Não autorizado." };
  }

  const start = Math.max(0, Math.floor(index)) * DOC_CHUNK_CHARS + 1; // SQLite substr é 1-based
  const rows = await prisma.$queryRaw<{ part: string | null; len: number | bigint }[]>`
    SELECT substr("base64Data", ${start}, ${DOC_CHUNK_CHARS}) AS part, LENGTH("base64Data") AS len FROM documents WHERE id = ${id}`;
  const row = rows[0];
  if (!row) return { success: false as const, error: "Documento não encontrado." };
  return { success: true as const, part: row.part || "", total: Number(row.len) };
}

// Documento de LOTE (aba "Processo de Importação": invoice, swift, AWB...), em partes.
// Mesmos metadados de addLotDocument (etapa, projeto e investidor do lote).
export async function beginLotDocumentUpload(meta: {
  lotId: string;
  name: string;
  category: string;
  size: string;
  totalChars: number;
  firstChunk: string;
}) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false as const, error: "Não autorizado." };
  if (!meta.name?.trim()) return { success: false as const, error: "Arquivo sem nome." };
  if (!Number.isFinite(meta.totalChars) || meta.totalChars <= 0 || meta.totalChars > MAX_TOTAL_CHARS) {
    return { success: false as const, error: "Arquivo acima do limite de 25 MB." };
  }
  if (!meta.firstChunk || meta.firstChunk.length > DOC_CHUNK_CHARS + 1024) {
    return { success: false as const, error: "Parte do arquivo inválida." };
  }

  try {
    const lot = await prisma.importLot.findUnique({
      where: { id: meta.lotId },
      select: { id: true, investmentProjectId: true, investmentProject: { select: { investorId: true } } },
    });
    if (!lot) return { success: false as const, error: "Lote não encontrado." };

    const doc = await prisma.document.create({
      data: {
        name: meta.name.trim(),
        type: meta.name.toUpperCase().endsWith(".PDF") ? "PDF" : "IMAGE",
        category: meta.category,
        stage: CATEGORY_TO_STAGE[meta.category] || null,
        size: meta.size,
        base64Data: meta.firstChunk,
        lotId: lot.id,
        projectId: lot.investmentProjectId || null,
        userId: lot.investmentProject?.investorId || null,
      },
      select: { id: true },
    });
    return { success: true as const, id: doc.id };
  } catch (error) {
    console.error("Erro ao iniciar upload do documento do lote:", error);
    return { success: false as const, error: "Falha ao gravar o documento." };
  }
}
