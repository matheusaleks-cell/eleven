import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔥 Iniciando Limpeza do Banco de Dados...");
  
  await prisma.lead.deleteMany();
  await prisma.weaponMap.deleteMany();
  await prisma.product.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.importLot.deleteMany();
  await prisma.investmentProject.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();

  console.log("🌱 Semeando Lógica Financeira Exata (VEZIR ARMS VR12 PUMP)...");

  const hashedPassword = await bcrypt.hash("password123", 12);

  // 1. Usuários
  const admin = await prisma.user.create({
    data: { name: "Administrador Master", email: "admin@elevenfirearms.com.br", password: hashedPassword, role: "ADMIN" },
  });

  const inv1 = await prisma.user.create({
    data: { name: "Francisco Investidor", email: "francisco@email.com", password: hashedPassword, role: "INVESTOR", phone: "(11) 98888-1111" },
  });

  const sup1 = await prisma.supplier.create({
    data: { name: "Vezir Arms", country: "Turquia", contactEmail: "export@vezir.com", status: "ACTIVE" },
  });

  // 2. O PROJETO EXATO CONFORME A LÓGICA DO USUÁRIO
  const projVR12 = await prisma.investmentProject.create({
    data: {
      name: "VEZIR ARMS VR12 PUMP · LOTE 1",
      productName: "Vezir VR12 Pump",
      investorId: inv1.id,
      createdById: admin.id,
      initialCapital: 74800.0, // Custo total nacionalizado exato
      maxCycles: 8,
      status: "ACTIVE",
      contractNumber: "CT-VR12-001",
      startDate: new Date("2024-01-10"),
    },
  });

  // 3. Lote de Importação
  const lot1 = await prisma.importLot.create({
    data: {
      batchCode: "LOT-VR12-001",
      supplierId: sup1.id,
      countryOrigin: "Turquia",
      purchaseDate: new Date("2024-01-15"),
      exchangeRate: 5.20,
      fobValue: 20664.0,       // FOB Fornecedor
      freight: 6642.0,         // Frete
      insurance: 0,
      customsTaxes: 34000.0,   // Impostos Importação
      customsFees: 13500.0,    // Desembaraço + Adicionais (8500 + 5000)
      totalCostNationalized: 74800.0, // Total cravado
      quantityItems: 30,       // Exatamente 30 unidades
      status: "LIQUIDADO",
      investmentProjectId: projVR12.id,
      expectedMarginPct: 35.0, // Margem Líquida ~35%
    },
  });

  // 4. Produto
  const prodVR12 = await prisma.product.create({
    data: {
      sku: "TUR-VR12-PUMP",
      commercialName: "Espingarda Vezir VR12 Pump",
      brand: "Vezir Arms",
      model: "VR12",
      caliber: "12 Gauge",
      species: "Espingarda",
      actionType: "Pump Action",
      capacity: 7,
      barrelLength: 20.0,
      finish: "Oxidado Fosco",
      originCountry: "Turquia",
      ncm: "9303.20.00",
      priceB2C: 6000.0,        // NOVO PREÇO EXATO
      priceB2B: 4800.0,
      stockAvailable: 30,
      importLotId: lot1.id,
    },
  });

  // 5. CICLO EXATO (CRAVADO COM A LÓGICA DO USUÁRIO)
  // Faturamento Bruto: 30 * 6000 = 180.000
  // Impostos (8%): 14.400
  // Despesas Operacionais (15%): 27.000
  // Custo: 74.800
  // Lucro Líquido Final: 63.800
  // 50% Empresa: 31.900
  // 50% Investidor: 31.900
  await prisma.cycle.create({
    data: {
      projectId: projVR12.id,
      cycleNumber: 1,
      cycleName: "Lote 1 - 30 Unidades",
      status: "COMPLETED",
      totalInvestment: 74800,        // Capital
      grossRevenue: 180000,          // 30 x 6000
      salesTax: 14400,               // DAS / Simples 8%
      salesOperationalCost: 27000,   // Despesas 15%
      netRevenue: 138600,            // 180000 - 14400 - 27000
      grossProfit: 63800,            // Net (138600) - Custo (74800)
      investorShare: 31900,          // 50% Líquido
      companyShare: 31900,           // 50% Líquido
      reinvestmentShare: 31900,      // O investidor não saca, reinveste 100% da parte dele
      reserveShare: 0,
      
      // Detalhamento do Lote Exato
      quantity: 30,
      salePricePerUnit: 6000,
      exchangeRateUsd: 5.20,
      fobValueUsd: 20664,
      freightUsd: 6642,
      insuranceUsd: 0,
      customsValueBrl: 34000,        // Agrupado
      iiTax: 0,
      ipiTax: 0,
      afrmmTax: 0,
      capatazia: 8500,
      pisPasepTax: 0,
      cofinsTax: 0,
      siscomexFee: 0,
      icmsSt: 0,
      simplesTax: 0,
      operationalCost: 5000,
      calcBaseNormal: 0,
      icmsBaseAltered: 0,
      icmsImportTax: 0,
    }
  });

  // O PRÓXIMO CICLO (Lote 2 - 42 Unidades)
  // Caixa Novo = 74.800 + 31.900 = 106.700
  await prisma.cycle.create({
    data: {
      projectId: projVR12.id,
      cycleNumber: 2,
      cycleName: "Lote 2 - Crescimento (42 Uni)",
      status: "PENDING",
      totalInvestment: 106700,       // Novo Caixa Reinvestido
      grossRevenue: 252000,          // 42 x 6000
      salesTax: 20160,               // 8%
      salesOperationalCost: 37800,   // 15%
      netRevenue: 194040,            
      grossProfit: 87340,            // 194040 - 106700
      investorShare: 43670,          // 50%
      companyShare: 43670,           // 50%
      reinvestmentShare: 43670,
      reserveShare: 0,
      
      quantity: 42,
      salePricePerUnit: 6000,
      exchangeRateUsd: 5.20,
      fobValueUsd: 28000,
      freightUsd: 8000,
      insuranceUsd: 0,
      customsValueBrl: 50000,
      iiTax: 0, ipiTax: 0, afrmmTax: 0, capatazia: 10000, pisPasepTax: 0, cofinsTax: 0, siscomexFee: 0, icmsSt: 0, simplesTax: 0, operationalCost: 6000, calcBaseNormal: 0, icmsBaseAltered: 0, icmsImportTax: 0,
    }
  });


  // 6. Dados Auxiliares B2C e Pedidos simulando as vendas do Ciclo 1
  const cli1 = await prisma.customer.create({
    data: { name: "Cliente Avulso VR12", type: "B2C", cpfCnpj: "000.000.000-00", phone: "(00) 0000-0000", state: "SP" }
  });

  // Simulamos a venda inteira das 30 peças para fechar as contas
  await prisma.salesOrder.create({
    data: {
      orderNumber: "PED-VR12-ALL",
      customerId: cli1.id,
      sellerId: admin.id,
      products: JSON.stringify([{ productId: prodVR12.id, qty: 30, price: 6000 }]),
      totalValue: 180000,
      status: "PAGO",
      paymentMethod: "PIX",
      proposedDate: new Date("2024-02-15"),
    }
  });

  console.log("💎 Lógica Financeira Exata Semeada com Sucesso!");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
