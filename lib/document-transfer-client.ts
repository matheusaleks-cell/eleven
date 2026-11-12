"use client";

import {
  beginProjectDocumentUpload,
  beginLotDocumentUpload,
  appendDocumentChunk,
  finishProjectDocumentUpload,
  abortDocumentUpload,
  getDocumentChunk,
} from "@/app/actions/document-transfer";
import { DOC_CHUNK_CHARS, DOC_MAX_FILE_BYTES } from "@/lib/document-transfer-shared";

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

// Envia um documento de projeto em partes. Lança Error com mensagem amigável se falhar.
export async function uploadProjectDocumentInChunks(
  file: File,
  opts: { projectId: string; category: string; onProgress?: (pct: number) => void }
) {
  if (file.size > DOC_MAX_FILE_BYTES) {
    throw new Error(`Arquivo de ${(file.size / 1024 / 1024).toFixed(1)} MB. O limite é ${DOC_MAX_FILE_BYTES / 1024 / 1024} MB.`);
  }
  const dataUrl = await readFileAsDataUrl(file);
  const chunks: string[] = [];
  for (let i = 0; i < dataUrl.length; i += DOC_CHUNK_CHARS) chunks.push(dataUrl.slice(i, i + DOC_CHUNK_CHARS));

  const type = file.type.includes("pdf") ? "PDF" : file.type.includes("image") ? "IMAGEM" : "ARQUIVO";
  const size = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

  const begin = await beginProjectDocumentUpload({
    projectId: opts.projectId,
    name: file.name,
    type,
    category: opts.category,
    size,
    totalChars: dataUrl.length,
    firstChunk: chunks[0],
  });
  if (!begin.success) throw new Error(begin.error);
  opts.onProgress?.(Math.round((1 / chunks.length) * 100));

  try {
    let sent = chunks[0].length;
    for (let i = 1; i < chunks.length; i++) {
      const r = await appendDocumentChunk(begin.id, chunks[i], sent);
      if (!r.success) throw new Error(r.error);
      sent += chunks[i].length;
      opts.onProgress?.(Math.round(((i + 1) / chunks.length) * 100));
    }
    const done = await finishProjectDocumentUpload(begin.id, dataUrl.length);
    if (!done.success) throw new Error(done.error);
    return begin.id;
  } catch (e) {
    await abortDocumentUpload(begin.id).catch(() => {});
    throw e instanceof Error ? e : new Error("Falha no envio.");
  }
}

// Data URL do documento: usa a que veio na lista ou baixa em partes (documentos grandes).
export async function resolveDocumentDataUrl(doc: { id: string; base64Data?: string | null }): Promise<string> {
  if (doc.base64Data) return doc.base64Data;
  let out = "";
  for (let i = 0; ; i++) {
    const r = await getDocumentChunk(doc.id, i);
    if (!r.success) throw new Error(r.error);
    out += r.part;
    if (!r.part || out.length >= r.total) break;
  }
  return out;
}

export async function downloadDocument(doc: { id: string; name: string; base64Data?: string | null }) {
  const dataUrl = await resolveDocumentDataUrl(doc);
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = doc.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Documento de lote já lido como data URL (os cartões de documento leem o arquivo antes):
// envia em partes e devolve { success, error } no mesmo formato que addLotDocument.
export async function uploadLotDocumentDataUrl(lotId: string, fileName: string, fileSize: number, category: string, dataUrl: string) {
  try {
    if (fileSize > DOC_MAX_FILE_BYTES) {
      return { success: false, error: `Arquivo de ${(fileSize / 1024 / 1024).toFixed(1)} MB. O limite é ${DOC_MAX_FILE_BYTES / 1024 / 1024} MB.` };
    }
    const chunks: string[] = [];
    for (let i = 0; i < dataUrl.length; i += DOC_CHUNK_CHARS) chunks.push(dataUrl.slice(i, i + DOC_CHUNK_CHARS));
    const begin = await beginLotDocumentUpload({
      lotId,
      name: fileName,
      category,
      size: `${(fileSize / 1024).toFixed(1)} KB`,
      totalChars: dataUrl.length,
      firstChunk: chunks[0],
    });
    if (!begin.success) return { success: false, error: begin.error };
    try {
      let sent = chunks[0].length;
      for (let i = 1; i < chunks.length; i++) {
        const r = await appendDocumentChunk(begin.id, chunks[i], sent);
        if (!r.success) throw new Error(r.error);
        sent += chunks[i].length;
      }
      const done = await finishProjectDocumentUpload(begin.id, dataUrl.length);
      if (!done.success) throw new Error(done.error);
      return { success: true };
    } catch (e) {
      await abortDocumentUpload(begin.id).catch(() => {});
      return { success: false, error: (e as Error)?.message || "Falha no envio." };
    }
  } catch (e) {
    return { success: false, error: (e as Error)?.message || "Falha de comunicação com o servidor." };
  }
}
