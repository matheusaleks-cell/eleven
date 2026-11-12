// Constantes compartilhadas (cliente e servidor) do envio/download de documentos em partes.

// Tamanho de cada parte (caracteres da data URL base64). Bem abaixo do limite de ~6 MB por
// requisição da hospedagem.
export const DOC_CHUNK_CHARS = 2_000_000;

// Documentos acima disso não vão inteiros nas listas (o conteúdo é baixado em partes ao abrir).
export const DOC_INLINE_MAX_CHARS = 2_500_000;

// Tamanho máximo do arquivo aceito no envio em partes.
export const DOC_MAX_FILE_BYTES = 25 * 1024 * 1024;

// Tira o conteúdo dos documentos grandes antes de mandar uma lista ao navegador.
export function stripLargeDocuments<T extends { base64Data?: string | null }>(docs: T[]): (T & { largeFile?: boolean })[] {
  return docs.map((d) =>
    d.base64Data && d.base64Data.length > DOC_INLINE_MAX_CHARS ? { ...d, base64Data: "", largeFile: true } : d
  );
}
