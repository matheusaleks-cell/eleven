// Helpers compartilhados pelos geradores de PDF (Anexo P) do SaleModal e do LeadWorkspace.

// Aceita Date, string ISO ou vazio (formatos que variam conforme a origem do dado: perfil x seletor do PDV)
export const fmtDate = (v: unknown) => {
  if (!v) return "N/A";
  const d = v instanceof Date ? v : new Date(v as string);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("pt-BR");
};

// Carrega um PNG estático em base64 sob demanda, evitando embutir a imagem no bundle JS
export const loadImageAsDataURL = async (src: string): Promise<string> => {
  const res = await fetch(src);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
