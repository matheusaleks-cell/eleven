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

// Campos do Product usados no corpo do Anexo P — quando ausentes, o documento sai com "N/A".
const ANEXO_P_SPEC_FIELDS: { key: string; label: string }[] = [
  { key: "species", label: "Espécie" },
  { key: "caliber", label: "Calibre" },
  { key: "actionType", label: "Sistema de Ação" },
  { key: "barrelLength", label: "Comprimento do Cano" },
  { key: "finish", label: "Acabamento" },
  { key: "originCountry", label: "País de Origem" },
];

// Retorna os rótulos das specs do produto que estão vazias/zeradas e por isso sairão como "N/A" no Anexo P.
export const getMissingAnexoPSpecs = (product: Record<string, unknown> | undefined): string[] => {
  if (!product) return ANEXO_P_SPEC_FIELDS.map(f => f.label);
  return ANEXO_P_SPEC_FIELDS.filter(f => !product[f.key]).map(f => f.label);
};
