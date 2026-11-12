// Produtos de um projeto de investimento (InvestmentProject.productMix, JSON).
// Só produtos do catálogo. Com mais de um modelo, cada um tem a quantidade por ciclo.

export interface ProductMixItem {
  productId: string;
  name: string;
  quantity: number | null; // obrigatório (>= 1) quando há mais de um produto
}

export function parseProductMix(raw: string | null | undefined): ProductMixItem[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((i) => i && typeof i.productId === "string")
      .map((i) => ({
        productId: i.productId,
        name: String(i.name || ""),
        quantity: Number.isInteger(i.quantity) && i.quantity > 0 ? i.quantity : null,
      }));
  } catch {
    return [];
  }
}

// Texto exibido no lugar do produto (lista de projetos, painel do investidor...).
export function productMixLabel(mix: ProductMixItem[]): string {
  if (mix.length <= 1) return mix[0]?.name || "";
  return mix.map((i) => (i.quantity ? `${i.name} (${i.quantity})` : i.name)).join(" + ");
}

// Compara nomes ignorando espaço, hífen e caixa ("VR12-P" == "VR 12-P" == "vr 12 p").
export function sameProductName(a: string, b: string): boolean {
  const norm = (s: string) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return norm(a) !== "" && norm(a) === norm(b);
}
