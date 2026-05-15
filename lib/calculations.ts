// =============================================
// TIPOS
// =============================================

export interface TaxConfig {
  id: string;
  name: string;
  ii_rate: number;
  ipi_rate: number;
  pis_rate: number;
  cofins_rate: number;
  icms_rate: number;
  icms_factor: number;
  siscomex_fixed: number;
  operational_fixed: number;
  sales_tax_rate: number;
  sales_op_rate: number;
  is_active: boolean;
  created_at: string;
}

export interface CycleInputs {
  quantity: number;
  salePricePerUnit: number;
  exchangeRate: number;
  fobUSD: number;
  freightUSD: number;
  insuranceUSD: number;
}

export interface CycleResult {
  customsValueBRL: number;
  ii: number;
  ipi: number;
  pisPasep: number;
  cofins: number;
  siscomex: number;
  opCost: number;
  calcBaseNormal: number;
  icmsBaseAltered: number;
  icmsImport: number;
  totalInvestment: number;
  grossRevenue: number;
  salesTax: number;
  salesOpCost: number;
  netBalance: number;
  profitToSplit: number;
  investorShare: number;
  companyShare: number;
  investorCashRes: number;
  nextCycleCapital: number;
  costPerUnit: number;
  profitPerUnit: number;
}

// =============================================
// TIPOS DO SIMULADOR DE LOTES
// =============================================

export interface SimulatorInputs {
  /** Quantidade de unidades no primeiro lote */
  initialQuantity: number;
  /** Preço FOB unitário em USD */
  fobUnitUSD: number;
  /** Taxa de câmbio BRL/USD */
  exchangeRate: number;
  /** Preço de venda unitário em BRL */
  salePricePerUnit: number;
  /**
   * Custo adicional fixo de importação em BRL:
   * frete + II + IPI + PIS/COFINS + ICMS + SISCOMEX + desembaraço + armazenagem
   */
  importAdditionalCostBRL: number;
  /** Alíquota de impostos sobre vendas (ex: 0.08 = 8%) */
  salesTaxRate: number;
  /** Alíquota de despesas operacionais sobre vendas (ex: 0.15 = 15%) */
  opExRate: number;
  /** Percentual do lucro líquido destinado ao investidor (ex: 0.50 = 50%) */
  investorSplitPct: number;
  /** Número de lotes a projetar */
  numBatches: number;
}

export interface BatchProjection {
  batchNumber: number;
  quantity: number;
  /** Custo total do lote (APORTE) */
  totalImportCostBRL: number;
  costPerUnit: number;
  grossRevenue: number;
  salesTax: number;
  opExCost: number;
  /** Lucro líquido antes da divisão (netLiquidProfit = grossRevenue - salesTax - opEx - custo) */
  netLiquidProfit: number;
  /** Fatia do investidor */
  investorShare: number;
  /** Fatia da empresa */
  companyShare: number;
  /** ROI do investidor neste lote (%) */
  investorROI: number;
  /** Capital disponível para o próximo lote (capital + lucro investidor) */
  nextBatchCapital: number;
  /** Unidades estimadas no próximo lote com o capital disponível */
  nextBatchQuantity: number;
  /** Ganhos acumulados do investidor até este lote */
  cumulativeInvestorEarnings: number;
}

// =============================================
// SIMULADOR DE ESCALADA DE LOTES
// =============================================

/**
 * Projeta a escalada de lotes com reinvestimento automático.
 *
 * Regra pactuada:
 *   - Empresa retira apenas sua fatia do lucro a cada lote.
 *   - Recompra usa: capital original + lucro do investidor.
 *   - Capital disponível para o próximo lote = totalImportCostBRL + investorShare
 *
 * Cenário base (Rifle .22 — Lote 1):
 *   Aporte: R$ 59.000 | Faturamento: R$ 180.000
 *   Impostos venda: R$ 14.400 (8%) | OpEx: R$ 27.000 (15%)
 *   Lucro líquido: R$ 79.600
 *   Investidor: R$ 39.800 | Empresa: R$ 39.800
 *   Recompra Lote 2: R$ 59.000 + R$ 39.800 = R$ 98.800 → ≈ 83 rifles
 */
export function projectFutureBatches(inputs: SimulatorInputs): BatchProjection[] {
  const {
    initialQuantity,
    fobUnitUSD,
    exchangeRate,
    salePricePerUnit,
    importAdditionalCostBRL,
    salesTaxRate,
    opExRate,
    investorSplitPct,
    numBatches,
  } = inputs;

  const fobBRL = fobUnitUSD * exchangeRate;
  const firstLotFobTotal = fobBRL * initialQuantity;
  const firstLotTotalCost = firstLotFobTotal + importAdditionalCostBRL;
  const costPerUnitBase = firstLotTotalCost / initialQuantity;

  const projections: BatchProjection[] = [];
  let availableCapital = firstLotTotalCost;
  let cumulativeInvestorEarnings = 0;

  for (let i = 1; i <= numBatches; i++) {
    const quantity =
      i === 1
        ? initialQuantity
        : Math.floor(availableCapital / costPerUnitBase);

    const totalImportCostBRL = quantity * costPerUnitBase;
    const grossRevenue = quantity * salePricePerUnit;
    const salesTax = grossRevenue * salesTaxRate;
    const opExCost = grossRevenue * opExRate;
    const netLiquidProfit =
      grossRevenue - salesTax - opExCost - totalImportCostBRL;
    const investorShare = netLiquidProfit * investorSplitPct;
    const companyShare = netLiquidProfit * (1 - investorSplitPct);
    const investorROI =
      totalImportCostBRL > 0
        ? (investorShare / totalImportCostBRL) * 100
        : 0;
    const nextBatchCapital = totalImportCostBRL + investorShare;
    const nextBatchQuantity = Math.floor(nextBatchCapital / costPerUnitBase);

    cumulativeInvestorEarnings += investorShare;

    projections.push({
      batchNumber: i,
      quantity,
      totalImportCostBRL,
      costPerUnit: costPerUnitBase,
      grossRevenue,
      salesTax,
      opExCost,
      netLiquidProfit,
      investorShare,
      companyShare,
      investorROI,
      nextBatchCapital,
      nextBatchQuantity,
      cumulativeInvestorEarnings,
    });

    availableCapital = nextBatchCapital;
  }

  return projections;
}

/**
 * Preset para o cenário Rifle .22 conforme premissas acordadas.
 * importAdditionalCostBRL = 39.320 (R$ 59.000 total − R$ 19.680 FOB)
 */
export const RIFLE_22_PRESET: SimulatorInputs = {
  initialQuantity: 50,
  fobUnitUSD: 80,
  exchangeRate: 4.92,
  salePricePerUnit: 3600,
  importAdditionalCostBRL: 39320,
  salesTaxRate: 0.08,
  opExRate: 0.15,
  investorSplitPct: 0.50,
  numBatches: 5,
};

// =============================================
// CÁLCULO PRINCIPAL (CICLO — ERP)
// =============================================

export function calculateCycle(
  inputs: CycleInputs,
  taxConfig: TaxConfig,
  splitPct: number
): CycleResult {
  // 1. IMPORTAÇÃO
  const customsValueBRL =
    (inputs.fobUSD + inputs.freightUSD + inputs.insuranceUSD) *
    inputs.exchangeRate;
  const ii = customsValueBRL * taxConfig.ii_rate;
  const ipi = (customsValueBRL + ii) * taxConfig.ipi_rate;

  // Base PIS/COFINS Importação (CIF + II + IPI)
  const basePisCofins = customsValueBRL + ii + ipi;
  const pisPasep = basePisCofins * taxConfig.pis_rate;
  const cofins = basePisCofins * taxConfig.cofins_rate;

  const siscomex = taxConfig.siscomex_fixed;
  const opCost = taxConfig.operational_fixed;

  // Base ICMS "por dentro"
  const calcBaseNormal =
    customsValueBRL + ii + ipi + pisPasep + cofins + siscomex + opCost;

  // Gross-up do ICMS (Base = Valor / (1 − Alíquota))
  const icmsBaseAltered = calcBaseNormal / taxConfig.icms_factor;
  const icmsImport = icmsBaseAltered * taxConfig.icms_rate;

  const totalInvestment = icmsBaseAltered;

  // 2. VENDAS
  const grossRevenue = inputs.quantity * inputs.salePricePerUnit;
  const salesTax = grossRevenue * taxConfig.sales_tax_rate;
  const salesOpCost = grossRevenue * taxConfig.sales_op_rate;
  const netBalance = grossRevenue - salesTax - salesOpCost;
  const profitToSplit = netBalance - totalInvestment;
  const investorShare = profitToSplit * splitPct;
  const companyShare = profitToSplit * (1 - splitPct);
  const investorCashRes = investorShare;
  const nextCycleCapital = totalInvestment + investorShare;

  // 3. POR UNIDADE
  const costPerUnit = totalInvestment / inputs.quantity;
  const profitPerUnit = grossRevenue / inputs.quantity - costPerUnit;

  return {
    customsValueBRL,
    ii,
    ipi,
    pisPasep,
    cofins,
    siscomex,
    opCost,
    calcBaseNormal,
    icmsBaseAltered,
    icmsImport,
    totalInvestment,
    grossRevenue,
    salesTax,
    salesOpCost,
    netBalance,
    profitToSplit,
    investorShare,
    companyShare,
    investorCashRes,
    nextCycleCapital,
    costPerUnit,
    profitPerUnit,
  };
}

// =============================================
// NOME DO CICLO
// =============================================

export function getCycleName(cycleNumber: number): string {
  if (cycleNumber === 0) return "Aplicação";
  const ordinals = [
    "1ª","2ª","3ª","4ª","5ª","6ª","7ª","8ª","9ª","10ª",
    "11ª","12ª","13ª","14ª","15ª","16ª","17ª","18ª","19ª","20ª",
  ];
  return `${ordinals[cycleNumber - 1] ?? cycleNumber + "ª"} Reaplicação`;
}

// =============================================
// FORMATAÇÃO
// =============================================

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR");
}
