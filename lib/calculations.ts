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
// CÁLCULO PRINCIPAL
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
  
  // Base PIS/COFINS Importação conforme instrução (CIF + II + IPI)
  const basePisCofins = customsValueBRL + ii + ipi;
  const pisPasep = basePisCofins * taxConfig.pis_rate;
  const cofins = basePisCofins * taxConfig.cofins_rate;
  
  const siscomex = taxConfig.siscomex_fixed;
  const opCost = taxConfig.operational_fixed;

  // Base ICMS "por dentro"
  // Soma de todos os custos antes do ICMS
  const calcBaseNormal =
    customsValueBRL + ii + ipi + pisPasep + cofins + siscomex + opCost;
    
  // Gross-up do ICMS (Base = Valor / (1 - Alíquota))
  const icmsBaseAltered = calcBaseNormal / taxConfig.icms_factor;
  const icmsImport = icmsBaseAltered * taxConfig.icms_rate;
  
  // O custo total da importação (nacionalizada) é a base bruta do ICMS
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
