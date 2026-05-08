import { calculateCycle } from "./calculations";

// TaxConfig completo
export const defaultTaxConfig = {
  id: "tax-default",
  name: "Configuração Padrão 2025",
  is_active: true,
  created_at: "2025-01-01",
  ii_rate: 0.18,
  ipi_rate: 0.55,
  pis_rate: 0.021,
  cofins_rate: 0.0965,
  icms_rate: 0.25,
  icms_factor: 0.75,
  siscomex_fixed: 214.50,
  operational_fixed: 9684,
  sales_tax_rate: 0.045,
  sales_op_rate: 0.08,
};

export interface Project {
  id: string;
  name: string;
  product_name: string;
  investor_id: string;
  investorName: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  initial_capital: number;
  currentCapital: number;
  totalRevenue: number;
  totalInvestorShare: number;
  totalCompanyShare: number;
  currentCycle: number;
  max_cycles: number;
  profit_split_pct: number;
  created_at: string;
  cycles: any[];
}

export const mockUsers = [
  { id: "user-admin",     name: "Administrador",   email: "admin@elevenfirearms.com.br", role: "ADMIN",     password: "123" },
  { id: "user-francisco", name: "Francisco Silva",  email: "francisco@email.com",         role: "INVESTOR",  password: "123", phone: "(11) 98888-1111", totalInvested: 63000,   totalReceived: 172298.49 },
  { id: "user-roberto",   name: "Roberto Alves",    email: "roberto@email.com",           role: "INVESTOR",  password: "123", phone: "(11) 97777-2222", totalInvested: 85000,   totalReceived: 21440.06 },
  { id: "user-marina",    name: "Marina Costa",     email: "marina@email.com",            role: "INVESTOR",  password: "123", phone: "(11) 96666-3333", totalInvested: 120000,  totalReceived: 63086.18 },
];

export const mockTaxConfigs = [
  { ...defaultTaxConfig },
  { ...defaultTaxConfig, id: "tax-2024", name: "Tabelas 2024", is_active: false, created_at: "2024-01-01", ii_rate: 0.16 },
];

// =============================================
// Calcular os 8 ciclos do Francisco
// =============================================
const c1 = calculateCycle({ quantity: 20,  salePricePerUnit: 8000, exchangeRate: 5.8, fobUSD: 4200,  freightUSD: 1200, insuranceUSD: 0 }, defaultTaxConfig, 0.5);
const c2 = calculateCycle({ quantity: 24,  salePricePerUnit: 8000, exchangeRate: 5.8, fobUSD: 5040,  freightUSD: 1440, insuranceUSD: 0 }, defaultTaxConfig, 0.5);
const c3 = calculateCycle({ quantity: 30,  salePricePerUnit: 8000, exchangeRate: 5.8, fobUSD: 6300,  freightUSD: 1800, insuranceUSD: 0 }, defaultTaxConfig, 0.5);
const c4 = calculateCycle({ quantity: 38,  salePricePerUnit: 8000, exchangeRate: 5.8, fobUSD: 7980,  freightUSD: 2280, insuranceUSD: 0 }, defaultTaxConfig, 0.5);
const c5 = calculateCycle({ quantity: 48,  salePricePerUnit: 8000, exchangeRate: 5.8, fobUSD: 10080, freightUSD: 2880, insuranceUSD: 0 }, defaultTaxConfig, 0.5);
const c6 = calculateCycle({ quantity: 60,  salePricePerUnit: 8000, exchangeRate: 5.8, fobUSD: 12600, freightUSD: 3600, insuranceUSD: 0 }, defaultTaxConfig, 0.5);
const c7 = calculateCycle({ quantity: 74,  salePricePerUnit: 8000, exchangeRate: 5.8, fobUSD: 15540, freightUSD: 4440, insuranceUSD: 0 }, defaultTaxConfig, 0.5);
const c8 = calculateCycle({ quantity: 94,  salePricePerUnit: 8000, exchangeRate: 5.8, fobUSD: 19740, freightUSD: 5640, insuranceUSD: 0 }, defaultTaxConfig, 0.5);

// Exportar ciclos já calculados com nomes corretos (camelCase conforme CycleResult)
export const computedCycles = [
  { id: "c1", cycleName: "Aplicação",       startDate: "2024-01-10", status: "COMPLETED", ...c1 },
  { id: "c2", cycleName: "1ª Reaplicação",  startDate: "2024-03-15", status: "COMPLETED", ...c2 },
  { id: "c3", cycleName: "2ª Reaplicação",  startDate: "2024-05-20", status: "COMPLETED", ...c3 },
  { id: "c4", cycleName: "3ª Reaplicação",  startDate: "2024-07-25", status: "COMPLETED", ...c4 },
  { id: "c5", cycleName: "4ª Reaplicação",  startDate: "2024-10-01", status: "COMPLETED", ...c5 },
  { id: "c6", cycleName: "5ª Reaplicação",  startDate: "2024-12-05", status: "COMPLETED", ...c6 },
  { id: "c7", cycleName: "6ª Reaplicação",  startDate: "2025-02-10", status: "COMPLETED", ...c7 },
  { id: "c8", cycleName: "7ª Reaplicação",  startDate: "2025-04-20", status: "COMPLETED", ...c8 },
];

export const mockProjects: Project[] = [
  {
    id: "proj-francisco",
    name: "VR-12P · Francisco · Lote 01",
    product_name: "Vezir Arms VR-12P",
    investor_id: "user-francisco",
    investorName: "Francisco Silva",
    status: "COMPLETED",
    initial_capital: 63000,
    currentCapital: computedCycles[7].nextCycleCapital,
    totalRevenue: computedCycles.reduce((a, c) => a + c.grossRevenue, 0),
    totalInvestorShare: computedCycles.reduce((a, c) => a + c.investorShare, 0),
    totalCompanyShare: computedCycles.reduce((a, c) => a + c.companyShare, 0),
    currentCycle: 8,
    max_cycles: 8,
    profit_split_pct: 0.5,
    created_at: "2024-01-01",
    cycles: computedCycles,
  },
  {
    id: "proj-mp5",
    name: "MP5 · Roberto · Lote 01",
    product_name: "HK MP5 A3",
    investor_id: "user-roberto",
    investorName: "Roberto Alves",
    status: "ACTIVE",
    initial_capital: 85000,
    currentCapital: computedCycles[2].nextCycleCapital,
    totalRevenue: computedCycles.slice(0, 3).reduce((a, c) => a + c.grossRevenue, 0),
    totalInvestorShare: computedCycles.slice(0, 3).reduce((a, c) => a + c.investorShare, 0),
    totalCompanyShare: computedCycles.slice(0, 3).reduce((a, c) => a + c.companyShare, 0),
    currentCycle: 3,
    max_cycles: 6,
    profit_split_pct: 0.5,
    created_at: "2025-02-15",
    cycles: computedCycles.slice(0, 3),
  },
  {
    id: "proj-glock",
    name: "Glock 17 · Marina · Lote 01",
    product_name: "Glock 17 Gen5",
    investor_id: "user-marina",
    investorName: "Marina Costa",
    status: "ACTIVE",
    initial_capital: 120000,
    currentCapital: computedCycles[4].nextCycleCapital,
    totalRevenue: computedCycles.slice(0, 5).reduce((a, c) => a + c.grossRevenue, 0),
    totalInvestorShare: computedCycles.slice(0, 5).reduce((a, c) => a + c.investorShare, 0),
    totalCompanyShare: computedCycles.slice(0, 5).reduce((a, c) => a + c.companyShare, 0),
    currentCycle: 5,
    max_cycles: 8,
    profit_split_pct: 0.5,
    created_at: "2025-03-20",
    cycles: computedCycles.slice(0, 5),
  },
];

export const dashboardStats = {
  activeProjects: mockProjects.filter(p => p.status === "ACTIVE").length,
  completedProjects: mockProjects.filter(p => p.status === "COMPLETED").length,
  totalRevenue: mockProjects.reduce((a, p) => a + p.totalRevenue, 0),
  totalInvestorShare: mockProjects.reduce((a, p) => a + p.totalInvestorShare, 0),
  totalCompanyShare: mockProjects.reduce((a, p) => a + p.totalCompanyShare, 0),
};
