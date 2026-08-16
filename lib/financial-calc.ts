import "server-only";
import { prisma } from "@/lib/prisma";

export interface FinancialRates {
  salesTaxRate: number;
  salesOpCostRate: number;
}

const FALLBACK_RATES: FinancialRates = { salesTaxRate: 0.08, salesOpCostRate: 0.15 };

// Fonte única das taxas de imposto e custo operacional sobre venda, usada por
// Dashboard, área do investidor e (na criação de um novo ciclo) pelo CycleModal.
// Antes disso, cada tela reimplementava esse cálculo com percentuais fixos
// diferentes (8%/15%, 8%/15%, 11%/15%) que podiam divergir entre si.
export async function getActiveFinancialRates(): Promise<FinancialRates> {
  try {
    const [taxConfig, splitRule] = await Promise.all([
      prisma.taxConfig.findFirst({ where: { isDefault: true } }).then(c => c ?? prisma.taxConfig.findFirst()),
      prisma.financialDistributionRule.findFirst({ where: { isActive: true }, orderBy: { updatedAt: "desc" } }),
    ]);

    const salesTaxRate = taxConfig ? (taxConfig.icmsSale + taxConfig.simplesNacional) / 100 : FALLBACK_RATES.salesTaxRate;
    // FinancialDistributionRule.operationalCost é editado/salvo como percentual inteiro (ex: 15 = 15%),
    // igual aos demais campos do mesmo modelo (investorPct, companyPct, etc.).
    const salesOpCostRate = splitRule && splitRule.operationalCost > 0 ? splitRule.operationalCost / 100 : FALLBACK_RATES.salesOpCostRate;

    return { salesTaxRate, salesOpCostRate };
  } catch (error) {
    console.error("Erro ao buscar taxas financeiras ativas:", error);
    return FALLBACK_RATES;
  }
}

// Quando um ciclo já tem imposto/custo operacional gravados (definidos pelo admin
// ao criar/fechar o ciclo), usa a taxa efetiva REAL daquele ciclo em vez da config
// global — mantém consistência com o que já foi oficialmente apurado para o lote.
export function ratesFromCycleOrDefault(
  cycle: { salesTax?: number | null; salesOperationalCost?: number | null; grossRevenue?: number | null } | null | undefined,
  defaults: FinancialRates
): FinancialRates {
  if (cycle?.grossRevenue && cycle.grossRevenue > 0 && ((cycle.salesTax ?? 0) > 0 || (cycle.salesOperationalCost ?? 0) > 0)) {
    return {
      salesTaxRate: (cycle.salesTax ?? 0) / cycle.grossRevenue,
      salesOpCostRate: (cycle.salesOperationalCost ?? 0) / cycle.grossRevenue,
    };
  }
  return defaults;
}

export interface UnitFinancials {
  saleValue: number;
  unitCost: number;
  taxAmount: number;
  operationalAmount: number;
  netProfit: number;
  investorShare: number;
  companyShare: number;
}

// Financeiro de UMA unidade vendida (imposto, custo operacional, lucro líquido e
// split investidor/empresa) — substitui as implementações duplicadas que existiam
// no Dashboard e na área do investidor.
export function computeUnitFinancials(
  saleValue: number,
  unitCost: number,
  splitPct: number,
  rates: FinancialRates
): UnitFinancials {
  const taxAmount = saleValue * rates.salesTaxRate;
  const operationalAmount = saleValue * rates.salesOpCostRate;
  const netProfit = saleValue - unitCost - taxAmount - operationalAmount;
  const investorShare = netProfit > 0 ? netProfit * splitPct : 0;
  const companyShare = netProfit > 0 ? netProfit * (1 - splitPct) : 0;
  return { saleValue, unitCost, taxAmount, operationalAmount, netProfit, investorShare, companyShare };
}
