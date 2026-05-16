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
  /** Capital planejado para este ciclo (initialCapital do projeto no ciclo 0, ou reinvestmentShare do ciclo anterior) */
  plannedCapital: number;
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

export interface ImportCosts {
  freight: number;
  ii: number;
  ipi: number;
  pisCofins: number;
  icms: number;
  siscomex: number;
  despacho: number;
  armazenagem: number;
}

export interface SimulatorInputs {
  /** Quantidade de unidades no primeiro lote */
  initialQuantity: number;
  /** Preço FOB unitário em USD */
  fobUnitUSD: number;
  /** Taxa de câmbio BRL/USD */
  exchangeRate: number;
  /** Preço de venda unitário em BRL */
  salePricePerUnit: number;
  /** Custo total de importação (Adicionais) em BRL */
  totalImportCostsBRL: number;
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
    salesTaxRate,
    opExRate,
    investorSplitPct,
    numBatches,
  } = inputs;

  const totalImportCostsBRL = inputs.totalImportCostsBRL;

  const fobBRL = fobUnitUSD * exchangeRate;
  const firstLotFobTotal = fobBRL * initialQuantity;
  const firstLotTotalCost = firstLotFobTotal + totalImportCostsBRL;
  const costPerUnitBase = firstLotTotalCost / initialQuantity;


  const projections: BatchProjection[] = [];
  let availableCapital = firstLotTotalCost;
  let cumulativeInvestorEarnings = 0;

  for (let i = 1; i <= numBatches; i++) {
    const quantity =
      i === 1
        ? initialQuantity
        : Math.floor(availableCapital / costPerUnitBase);

    // Aporte total do lote (FOB + adicionais proporcionais)
    const totalImportCostBRL = quantity * costPerUnitBase;

    // Faturamento bruto
    const grossRevenue = quantity * salePricePerUnit;

    // Deduções sobre faturamento
    const salesTax = grossRevenue * salesTaxRate;
    const opExCost = grossRevenue * opExRate;

    // Lucro líquido = Faturamento - Impostos Venda - OpEx - Custo do Lote
    // (sem contar o capital disponível no cálculo do lucro)
    const netLiquidProfit = grossRevenue - salesTax - opExCost - totalImportCostBRL;

    // Divisão do lucro entre investidor e empresa
    const investorShare = netLiquidProfit * investorSplitPct;
    const companyShare = netLiquidProfit * (1 - investorSplitPct);

    // ROI = lucro do investidor / aporte
    const investorROI =
      totalImportCostBRL > 0
        ? (investorShare / totalImportCostBRL) * 100
        : 0;

    // Capital do próximo lote = Aporte atual + Ganho do investidor (reinvestimento)
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

export const RIFLE_22_PRESET: SimulatorInputs = {
  initialQuantity: 50,
  fobUnitUSD: 80,
  exchangeRate: 4.92,
  salePricePerUnit: 3600,
  totalImportCostsBRL: 59000,
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

  // BUG FIX: PIS/COFINS incidem sobre Valor Aduaneiro (CIF) apenas, não sobre +II+IPI
  // Planilha: =F15*2.1% e =F15*9.65% onde F15 = Valor Aduaneiro
  const basePisCofins = customsValueBRL;
  const pisPasep = basePisCofins * taxConfig.pis_rate;
  const cofins = basePisCofins * taxConfig.cofins_rate;

  const siscomex = taxConfig.siscomex_fixed;
  const opCost = taxConfig.operational_fixed;

  // BUG FIX: Base de Cálculo Normal NÃO inclui Custo Operacional
  // Planilha: =SUM(F18:F30) — custo op está na linha 32, fora do range
  const calcBaseNormal =
    customsValueBRL + ii + ipi + pisPasep + cofins + siscomex;

  // Gross-up do ICMS "por dentro" (Base = Valor / Fator)
  const icmsBaseAltered = calcBaseNormal / taxConfig.icms_factor;
  const icmsImport = icmsBaseAltered * taxConfig.icms_rate;

  // BUG FIX: totalInvestment = Base Alterada (já inclui II+IPI+PIS+COFINS+Siscomex+ICMS) + Custo Op
  // Planilha: =F33+F39+F31+F32 → BASE_NORMAL + ICMS + Simples + CustoOp = icmsBaseAltered + opCost
  const totalInvestment = icmsBaseAltered + opCost;

  // 2. VENDAS
  const grossRevenue = inputs.quantity * inputs.salePricePerUnit;
  const salesTax = grossRevenue * taxConfig.sales_tax_rate;
  const salesOpCost = grossRevenue * taxConfig.sales_op_rate;

  // BUG FIX: Saldo Apurado usa capital planejado, conforme fórmula do Dashboard:
  // =B5+B7-B6-B8-B9 → VALOR_INVESTIDO + Faturamento - Investimento - Tributação - CustoOp
  const netBalance =
    inputs.plannedCapital + grossRevenue - totalInvestment - salesTax - salesOpCost;
  const profitToSplit = netBalance - totalInvestment;
  const investorShare = profitToSplit * splitPct;
  const companyShare = profitToSplit * (1 - splitPct);
  const investorCashRes = investorShare;
  // Saldo para novo investimento = totalInvestment + fatia do investidor
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
