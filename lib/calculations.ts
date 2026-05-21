// =============================================
// TIPOS — ERP/CICLO (mantidos para compatibilidade)
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

export interface SimulatorInputs {
  /** Quantidade de unidades no primeiro lote */
  initialQuantity: number;
  /** Preço FOB unitário em USD */
  fobUnitUSD: number;
  /** Frete internacional por unidade em USD */
  freightUnitUSD: number;
  /** Taxa de câmbio BRL/USD */
  exchangeRate: number;
  /** Preço de venda unitário em BRL */
  salePricePerUnit: number;

  // ── Alíquotas de importação ──────────────────────────────────────────────
  /** Imposto de Importação (ex: 0.18 = 18%) */
  iiRate: number;
  /** IPI sobre (VA + II) (ex: 0.55 = 55%) */
  ipiRate: number;
  /** PIS/PASEP sobre VA (ex: 0.021 = 2,1%) */
  pisRate: number;
  /** COFINS sobre VA (ex: 0.0965 = 9,65%) */
  cofinsRate: number;
  /** Fator de gross-up do ICMS (ex: 0.75) */
  icmsFactor: number;
  /** Alíquota do ICMS importação (ex: 0.25 = 25%) */
  icmsRate: number;
  /** Taxa de Siscomex — valor fixo por lote (R$) */
  siscomexFixed: number;
  /** Custo operacional aduaneiro — valor fixo por lote (R$) */
  custoOpFixed: number;

  // ── Deduções sobre vendas ────────────────────────────────────────────────
  /** Alíquota de impostos sobre vendas (Simples Nacional, ex: 0.08) */
  salesTaxRate: number;
  /** Despesas operacionais de venda em % do faturamento (ex: 0.15) */
  opExRate: number;
  /** Percentual do lucro líquido destinado ao investidor (ex: 0.50) */
  investorSplitPct: number;
  /** Número de lotes a projetar */
  numBatches: number;
}

export interface BatchProjection {
  batchNumber: number;
  quantity: number;
  /** Custo total do lote — APORTE */
  totalImportCostBRL: number;
  costPerUnit: number;
  /** Saldo remanescente do capital anterior não utilizado */
  carryover: number;
  grossRevenue: number;
  salesTax: number;
  opExCost: number;
  /** Saldo apurado = faturamento - tributação - opex + carryover */
  netBalance: number;
  /** Lucro líquido = saldo apurado - custo do lote */
  netLiquidProfit: number;
  investorShare: number;
  companyShare: number;
  /** ROI do investidor neste lote (%) */
  investorROI: number;
  /** Capital para o próximo lote = custo + fatia do investidor */
  nextBatchCapital: number;
  /** Estimativa de unidades para o próximo lote */
  nextBatchQuantity: number;
  /** Ganhos acumulados do investidor */
  cumulativeInvestorEarnings: number;
}

// =============================================
// CÁLCULO DO CUSTO REAL DE IMPORTAÇÃO
// Fórmula idêntica à planilha FRANCISCO:
//   VA  = (FOB + Frete) × qty × câmbio
//   II  = VA × ii_rate
//   IPI = (VA + II) × ipi_rate
//   PIS = VA × pis_rate
//   COFINS = VA × cofins_rate
//   BASE_NORMAL = VA + II + IPI + PIS + COFINS + Siscomex
//   BASE_ALTERADA = BASE_NORMAL / icms_factor          (gross-up ICMS "por dentro")
//   ICMS = BASE_ALTERADA × icms_rate
//   VALOR_TOTAL = BASE_ALTERADA + custo_op_fixo
// =============================================

export function calcImportCostBRL(qty: number, inp: SimulatorInputs): number {
  const icmsFactor = inp.icmsFactor > 0 ? inp.icmsFactor : 1;
  const va = (inp.fobUnitUSD + inp.freightUnitUSD) * qty * inp.exchangeRate;
  const ii = va * inp.iiRate;
  const ipi = (va + ii) * inp.ipiRate;
  const pis = va * inp.pisRate;
  const cofins = va * inp.cofinsRate;
  const baseNormal = va + ii + ipi + pis + cofins + inp.siscomexFixed;
  const baseAlterada = baseNormal / icmsFactor;
  return baseAlterada + inp.custoOpFixed;
}

/** Retorna o breakdown detalhado do custo de importação para exibição */
export function calcImportBreakdown(qty: number, inp: SimulatorInputs) {
  const icmsFactor = inp.icmsFactor > 0 ? inp.icmsFactor : 1;
  const va = (inp.fobUnitUSD + inp.freightUnitUSD) * qty * inp.exchangeRate;
  const ii = va * inp.iiRate;
  const ipi = (va + ii) * inp.ipiRate;
  const pis = va * inp.pisRate;
  const cofins = va * inp.cofinsRate;
  const siscomex = inp.siscomexFixed;
  const baseNormal = va + ii + ipi + pis + cofins + siscomex;
  const baseAlterada = baseNormal / icmsFactor;
  const icms = baseAlterada * inp.icmsRate;
  const custoOp = inp.custoOpFixed;
  const total = baseAlterada + custoOp;
  return { va, ii, ipi, pis, cofins, siscomex, baseNormal, baseAlterada, icms, custoOp, total };
}

/**
 * Calcula quantas unidades inteiras cabem no capital disponível,
 * resolvendo: total(N) = N×variável + fixo ≤ capital
 */
function maxUnitsForCapital(capital: number, inp: SimulatorInputs): number {
  const icmsFactor = inp.icmsFactor > 0 ? inp.icmsFactor : 1;
  const cifPerUnit = (inp.fobUnitUSD + inp.freightUnitUSD) * inp.exchangeRate;
  const iiPerUnit = cifPerUnit * inp.iiRate;
  const ipiPerUnit = (cifPerUnit + iiPerUnit) * inp.ipiRate;
  const pisPerUnit = cifPerUnit * inp.pisRate;
  const cofinsPerUnit = cifPerUnit * inp.cofinsRate;
  const baseNormalPerUnit = cifPerUnit + iiPerUnit + ipiPerUnit + pisPerUnit + cofinsPerUnit;
  const variableCostPerUnit = baseNormalPerUnit / icmsFactor;
  const fixedCostPerLot = inp.siscomexFixed / icmsFactor + inp.custoOpFixed;
  if (capital <= fixedCostPerLot) return 0;
  return Math.floor((capital - fixedCostPerLot) / variableCostPerUnit);
}

// =============================================
// SIMULADOR DE ESCALADA DE LOTES
// Regras da planilha FRANCISCO (VR12 Pump):
//   1. Custo real calculado com fórmula de importação completa (ICMS gross-up)
//   2. Saldo apurado inclui carryover (sobra do capital anterior)
//   3. Capital do próximo lote = custo_real + fatia_investidor
//      (carryover vai para reserva/operacional, não acumula)
// =============================================

export function projectFutureBatches(inputs: SimulatorInputs): BatchProjection[] {
  const firstLotCost = calcImportCostBRL(inputs.initialQuantity, inputs);

  const projections: BatchProjection[] = [];
  let availableCapital = firstLotCost; // No lote 1, capital = custo exato
  let cumulativeInvestorEarnings = 0;

  for (let i = 1; i <= inputs.numBatches; i++) {
    const quantity =
      i === 1 ? inputs.initialQuantity : maxUnitsForCapital(availableCapital, inputs);

    const totalImportCostBRL = calcImportCostBRL(quantity, inputs);

    // Saldo remanescente do capital anterior não gasto no lote
    const carryover = Math.max(0, availableCapital - totalImportCostBRL);

    const grossRevenue = quantity * inputs.salePricePerUnit;
    const salesTax = grossRevenue * inputs.salesTaxRate;
    const opExCost = grossRevenue * inputs.opExRate;

    // Saldo apurado = faturamento líquido de impostos + carryover (conforme planilha)
    const netBalance = grossRevenue - salesTax - opExCost + carryover;

    // Lucro líquido = saldo apurado - custo do lote
    const netLiquidProfit = netBalance - totalImportCostBRL;

    const investorShare = netLiquidProfit * inputs.investorSplitPct;
    const companyShare = netLiquidProfit * (1 - inputs.investorSplitPct);

    const investorROI =
      totalImportCostBRL > 0 ? (investorShare / totalImportCostBRL) * 100 : 0;

    // Próximo capital = custo real + fatia do investidor (carryover vai para reserva)
    const nextBatchCapital = totalImportCostBRL + investorShare;
    const nextBatchQuantity = maxUnitsForCapital(nextBatchCapital, inputs);

    cumulativeInvestorEarnings += investorShare;

    projections.push({
      batchNumber: i,
      quantity,
      totalImportCostBRL,
      costPerUnit: quantity > 0 ? totalImportCostBRL / quantity : 0,
      carryover,
      grossRevenue,
      salesTax,
      opExCost,
      netBalance,
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

// =============================================
// PRESET VR12 PUMP — exatamente como a planilha FRANCISCO
// =============================================
export const VR12_PUMP_PRESET: SimulatorInputs = {
  initialQuantity: 30,
  fobUnitUSD: 140,
  freightUnitUSD: 54,
  exchangeRate: 5.0,
  salePricePerUnit: 6000,
  iiRate: 0.18,
  ipiRate: 0.55,
  pisRate: 0.021,
  cofinsRate: 0.0965,
  icmsFactor: 0.75,
  icmsRate: 0.25,
  siscomexFixed: 154.23,
  custoOpFixed: 7884,
  salesTaxRate: 0.08,
  opExRate: 0.15,
  investorSplitPct: 0.50,
  numBatches: 7,
};

// Mantido para compatibilidade de chamadas antigas (agora aponta para VR12)
export const RIFLE_22_PRESET = VR12_PUMP_PRESET;

// =============================================
// CÁLCULO PRINCIPAL (CICLO — ERP) — sem alterações
// =============================================

export function calculateCycle(
  inputs: CycleInputs,
  taxConfig: TaxConfig,
  splitPct: number
): CycleResult {
  const customsValueBRL =
    (inputs.fobUSD + inputs.freightUSD + inputs.insuranceUSD) * inputs.exchangeRate;
  const ii = customsValueBRL * taxConfig.ii_rate;
  const ipi = (customsValueBRL + ii) * taxConfig.ipi_rate;

  const basePisCofins = customsValueBRL;
  const pisPasep = basePisCofins * taxConfig.pis_rate;
  const cofins = basePisCofins * taxConfig.cofins_rate;

  const siscomex = taxConfig.siscomex_fixed;
  const opCost = taxConfig.operational_fixed;

  const icmsFactor = taxConfig.icms_factor > 0 ? taxConfig.icms_factor : 1;
  const calcBaseNormal = customsValueBRL + ii + ipi + pisPasep + cofins + siscomex;
  const icmsBaseAltered = calcBaseNormal / icmsFactor;
  const icmsImport = icmsBaseAltered * taxConfig.icms_rate;

  const totalInvestment = icmsBaseAltered + opCost;

  const grossRevenue = inputs.quantity * inputs.salePricePerUnit;
  const salesTax = grossRevenue * taxConfig.sales_tax_rate;
  const salesOpCost = grossRevenue * taxConfig.sales_op_rate;

  const netBalance =
    inputs.plannedCapital + grossRevenue - totalInvestment - salesTax - salesOpCost;
  const profitToSplit = netBalance - totalInvestment;
  const investorShare = profitToSplit * splitPct;
  const companyShare = profitToSplit * (1 - splitPct);
  const investorCashRes = investorShare;
  const nextCycleCapital = totalInvestment + investorShare;

  const costPerUnit = inputs.quantity > 0 ? totalInvestment / inputs.quantity : 0;
  const profitPerUnit = inputs.quantity > 0 ? grossRevenue / inputs.quantity - costPerUnit : 0;

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
// UTILITÁRIOS
// =============================================

export function getCycleName(cycleNumber: number): string {
  if (cycleNumber === 0) return "Aplicação";
  const ordinals = [
    "1ª","2ª","3ª","4ª","5ª","6ª","7ª","8ª","9ª","10ª",
    "11ª","12ª","13ª","14ª","15ª","16ª","17ª","18ª","19ª","20ª",
  ];
  return `${ordinals[cycleNumber - 1] ?? cycleNumber + "ª"} Reaplicação`;
}

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
