import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔥 Iniciando Limpeza do Banco de Dados...");
  
  await prisma.lead.deleteMany();
  await prisma.leadLog.deleteMany();
  await prisma.weaponMap.deleteMany();
  await prisma.product.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.importLot.deleteMany();
  await prisma.investmentProject.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.taxConfig.deleteMany();
  await prisma.financialDistributionRule.deleteMany();
  await prisma.document.deleteMany();

  console.log("🌱 Semeando Lógica Financeira Exata com Dados de Francisco (Planilha VR-12)...");

  const hashedPassword = await bcrypt.hash("password123", 12);

  // 1. Usuários
  const admin = await prisma.user.create({
    data: { 
      name: "Administrador Master", 
      email: "admin@elevenfirearms.com.br", 
      password: hashedPassword, 
      role: "ADMIN" 
    },
  });

  const inv1 = await prisma.user.create({
    data: { 
      name: "Francisco Investidor", 
      email: "francisco@email.com", 
      password: hashedPassword, 
      role: "INVESTOR", 
      phone: "(11) 98888-1111",
      cpfCnpj: "123.456.789-00",
      rg: "12.345.678-9",
      address: "Alameda das Armas, 1000 - São Paulo/SP",
      bankDetails: "Banco do Brasil - Ag: 1234 - CC: 56789-0",
      profession: "Empresário"
    },
  });

  const sup1 = await prisma.supplier.create({
    data: { 
      name: "Vezir Arms", 
      country: "Turquia", 
      contactEmail: "export@vezir.com", 
      status: "ACTIVE" 
    },
  });

  // 2. O PROJETO EXATO CONFORME A LÓGICA DO USUÁRIO
  // Aporte Inicial é de 83.615 conforme planilha
  const projVR12 = await prisma.investmentProject.create({
    data: {
      name: "VR-12P · Francisco · Lote 01",
      productName: "Vezir VR12 Pump",
      investorId: inv1.id,
      createdById: admin.id,
      initialCapital: 83615.00, 
      maxCycles: 8,
      status: "ACTIVE",
      contractNumber: "CT-VR12-001",
      startDate: new Date("2024-01-10"),
    },
  });

  // 3. Produto
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
      priceB2C: 6000.0,
      priceB2B: 4800.0,
      stockAvailable: 208,
      technicalDescription: "Espingarda Vezir VR12 Pump Action, calibre 12 Gauge, ideal para esporte e defesa."
    },
  });

  // Cliente para simular vendas
  const cli1 = await prisma.customer.create({
    data: { 
      name: "Cliente Final Eleven", 
      type: "B2C", 
      cpfCnpj: "000.000.000-00", 
      phone: "(11) 99999-8888", 
      state: "SP" 
    }
  });

  // Definindo os lotes e ciclos exatos da planilha
  const lotesPlanilha = [
    {
      cycleNumber: 1,
      cycleName: "Aplicação (30 Unidades)",
      batchCode: "LOT-VR12-001",
      quantity: 30,
      totalInvestment: 83613.84,
      grossRevenue: 180000.00,
      salesTax: 14400.00,
      salesOperationalCost: 27000.00,
      netRevenue: 138601.16,
      grossProfit: 54987.32,
      investorShare: 27493.66,
      companyShare: 27493.66,
      reinvestmentShare: 27493.66,
      status: "COMPLETED",
      lotStatus: "LIQUIDADO"
    },
    {
      cycleNumber: 2,
      cycleName: "1ª Reaplicação (40 Unidades)",
      batchCode: "LOT-VR12-002",
      quantity: 40,
      totalInvestment: 108788.57,
      grossRevenue: 240000.00,
      salesTax: 19200.00,
      salesOperationalCost: 36000.00,
      netRevenue: 187118.93,
      grossProfit: 78330.35,
      investorShare: 39165.18,
      companyShare: 39165.18,
      reinvestmentShare: 39165.18,
      status: "COMPLETED",
      lotStatus: "LIQUIDADO"
    },
    {
      cycleNumber: 3,
      cycleName: "2ª Reaplicação (55 Unidades)",
      batchCode: "LOT-VR12-003",
      quantity: 55,
      totalInvestment: 146550.67,
      grossRevenue: 330000.00,
      salesTax: 26400.00,
      salesOperationalCost: 49500.00,
      netRevenue: 255503.08,
      grossProfit: 108952.40,
      investorShare: 54476.20,
      companyShare: 54476.20,
      reinvestmentShare: 54476.20,
      status: "COMPLETED",
      lotStatus: "LIQUIDADO"
    },
    {
      cycleNumber: 4,
      cycleName: "3ª Reaplicação (76 Unidades)",
      batchCode: "LOT-VR12-004",
      quantity: 76,
      totalInvestment: 199417.61,
      grossRevenue: 456000.00,
      salesTax: 36480.00,
      salesOperationalCost: 68400.00,
      netRevenue: 352729.26,
      grossProfit: 153311.65,
      investorShare: 76655.82,
      companyShare: 76655.82,
      reinvestmentShare: 76655.82,
      status: "COMPLETED",
      lotStatus: "LIQUIDADO"
    },
    {
      cycleNumber: 5,
      cycleName: "4ª Reaplicação (106 Unidades)",
      batchCode: "LOT-VR12-005",
      quantity: 106,
      totalInvestment: 274941.81,
      grossRevenue: 636000.00,
      salesTax: 50880.00,
      salesOperationalCost: 95400.00,
      netRevenue: 490851.62,
      grossProfit: 215909.81,
      investorShare: 107954.91,
      companyShare: 107954.91,
      reinvestmentShare: 107954.91,
      status: "COMPLETED",
      lotStatus: "LIQUIDADO"
    },
    {
      cycleNumber: 6,
      cycleName: "5ª Reaplicação (148 Unidades)",
      batchCode: "LOT-VR12-006",
      quantity: 148,
      totalInvestment: 380675.69,
      grossRevenue: 888000.00,
      salesTax: 71040.00,
      salesOperationalCost: 133200.00,
      netRevenue: 685981.03,
      grossProfit: 305305.33,
      investorShare: 152652.67,
      companyShare: 152652.67,
      reinvestmentShare: 152652.67,
      status: "COMPLETED",
      lotStatus: "LIQUIDADO"
    },
    {
      cycleNumber: 7,
      cycleName: "6ª Reaplicação (208 Unidades)",
      batchCode: "LOT-VR12-007",
      quantity: 208,
      totalInvestment: 531724.09,
      grossRevenue: 1248000.00,
      salesTax: 99840.00,
      salesOperationalCost: 187200.00,
      netRevenue: 962564.27,
      grossProfit: 430840.17,
      investorShare: 215420.09,
      companyShare: 215420.09,
      reinvestmentShare: 215420.09,
      status: "IN_PROGRESS", // O lote 7 está ativo em andamento
      lotStatus: "VENDA"
    }
  ];

  for (const item of lotesPlanilha) {
    console.log(`semeando lote e ciclo para: ${item.cycleName}`);
    
    // Criar Lote de Importação
    const lot = await prisma.importLot.create({
      data: {
        batchCode: item.batchCode,
        supplierId: sup1.id,
        countryOrigin: "Turquia",
        purchaseDate: new Date(2024, item.cycleNumber, 1),
        exchangeRate: 5.00,
        fobValue: item.totalInvestment * 0.4 / 5.0, // Estimado
        freight: item.totalInvestment * 0.1 / 5.0, // Estimado
        insurance: 0,
        customsTaxes: item.totalInvestment * 0.35, // Estimado
        customsFees: item.totalInvestment * 0.15, // Estimado
        totalCostNationalized: item.totalInvestment,
        quantityItems: item.quantity,
        status: item.lotStatus,
        investmentProjectId: projVR12.id,
        expectedMarginPct: 35.0,
      }
    });

    // Criar Ciclo
    await prisma.cycle.create({
      data: {
        projectId: projVR12.id,
        cycleNumber: item.cycleNumber,
        cycleName: item.cycleName,
        status: item.status,
        importLotId: lot.id,
        quantity: item.quantity,
        salePricePerUnit: 6000.00,
        exchangeRateUsd: 5.00,
        fobValueUsd: item.totalInvestment * 0.4 / 5.0,
        freightUsd: item.totalInvestment * 0.1 / 5.0,
        insuranceUsd: 0,
        customsValueBrl: item.totalInvestment * 0.35,
        iiTax: 0, ipiTax: 0, afrmmTax: 0, capatazia: 0, pisPasepTax: 0, cofinsTax: 0, siscomexFee: 0, icmsSt: 0, simplesTax: 0, operationalCost: 0, calcBaseNormal: 0, icmsBaseAltered: 0, icmsImportTax: 0,
        totalInvestment: item.totalInvestment,
        grossRevenue: item.grossRevenue,
        salesTax: item.salesTax,
        salesOperationalCost: item.salesOperationalCost,
        netRevenue: item.netRevenue,
        grossProfit: item.grossProfit,
        investorShare: item.investorShare,
        companyShare: item.companyShare,
        reinvestmentShare: item.reinvestmentShare,
        reserveShare: 0
      }
    });

    // Criar as Armas Físicas para este Lote
    const unitCost = item.totalInvestment / item.quantity;
    
    if (item.cycleNumber < 7) {
      // Todos os lotes anteriores estão liquidados, ou seja, 100% das armas vendidas
      for (let wIdx = 1; wIdx <= item.quantity; wIdx++) {
        await prisma.weaponMap.create({
          data: {
            productId: prodVR12.id,
            serialNumber: `${item.batchCode}-SN-${String(wIdx).padStart(3, "0")}`,
            supplierId: sup1.id,
            importLotId: lot.id,
            entryDate: new Date(2024, item.cycleNumber, 5),
            unitCost: unitCost,
            currentStatus: "VENDIDA",
            saleValue: 6000.00,
            saleDate: new Date(2024, item.cycleNumber, 20),
            customerId: cli1.id,
            customerCpfCnpj: cli1.cpfCnpj,
            customerState: cli1.state,
            sellingUserId: admin.id,
          }
        });
      }
    } else {
      // Lote 7 (em andamento): 208 unidades
      // 130 vendidas, 48 em estoque, 30 reservadas
      let soldCount = 0;
      let reservedCount = 0;
      
      for (let wIdx = 1; wIdx <= item.quantity; wIdx++) {
        let status = "ESTOQUE";
        let saleValue = null;
        let saleDate = null;
        let customerId = null;

        if (soldCount < 130) {
          status = "VENDIDA";
          saleValue = 6000.00;
          saleDate = new Date();
          customerId = cli1.id;
          soldCount++;
        } else if (reservedCount < 30) {
          status = "RESERVADA";
          reservedCount++;
        }

        await prisma.weaponMap.create({
          data: {
            productId: prodVR12.id,
            serialNumber: `${item.batchCode}-SN-${String(wIdx).padStart(3, "0")}`,
            supplierId: sup1.id,
            importLotId: lot.id,
            entryDate: new Date(),
            unitCost: unitCost,
            currentStatus: status,
            saleValue: saleValue,
            saleDate: saleDate,
            customerId: customerId,
            customerCpfCnpj: customerId ? cli1.cpfCnpj : null,
            customerState: customerId ? cli1.state : null,
            sellingUserId: customerId ? admin.id : null,
          }
        });
      }
    }
  }

  // 4. Lotes e armas avulsas para a empresa (Lotes próprios)
  // Criar lote próprio da empresa de TP9 para ter dados auxiliares no sistema
  const lotEmpresa = await prisma.importLot.create({
    data: {
      batchCode: "LOT-ELEVEN-TP9",
      supplierId: sup1.id,
      countryOrigin: "Turquia",
      purchaseDate: new Date(),
      exchangeRate: 5.80,
      fobValue: 50000.00,
      freight: 5000.00,
      insurance: 0,
      customsTaxes: 40000.00,
      customsFees: 15000.00,
      totalCostNationalized: 110000.00,
      quantityItems: 10,
      status: "VENDA",
      expectedMarginPct: 30.0,
    }
  });

  const prodTP9 = await prisma.product.create({
    data: {
      sku: "CANIK-TP9-EC",
      commercialName: "Canik TP9 Elite Combat",
      brand: "Canik",
      model: "TP9 Elite Combat",
      caliber: "9mm",
      species: "Pistola",
      actionType: "Semiautomática",
      capacity: 18,
      barrelLength: 4.7,
      finish: "FDE Cerakote",
      originCountry: "Turquia",
      ncm: "9302.00.00",
      priceB2C: 11500.00,
      priceB2B: 8900.00,
      stockAvailable: 10,
      importLotId: lotEmpresa.id,
    }
  });

  for (let i = 1; i <= 10; i++) {
    let status = "ESTOQUE";
    let saleValue = null;
    let saleDate = null;
    let customerId = null;

    if (i <= 4) {
      status = "VENDIDA";
      saleValue = 11500.00;
      saleDate = new Date();
      customerId = cli1.id;
    }

    await prisma.weaponMap.create({
      data: {
        productId: prodTP9.id,
        serialNumber: `TP9-SN-${String(i).padStart(3, "0")}`,
        supplierId: sup1.id,
        importLotId: lotEmpresa.id,
        entryDate: new Date(),
        unitCost: 11000.00,
        currentStatus: status,
        saleValue: saleValue,
        saleDate: saleDate,
        customerId: customerId,
        customerCpfCnpj: customerId ? cli1.cpfCnpj : null,
        customerState: customerId ? cli1.state : null,
        sellingUserId: customerId ? admin.id : null,
      }
    });
  }

  // 5. Default TaxConfig
  await prisma.taxConfig.create({
    data: {
      name: "Espingarda Importada (Padrão)",
      description: "Alíquotas padrão para espingardas importadas da Turquia — NCM 9303.20.00",
      ii: 20,
      ipi: 0,
      pisPasep: 2.1,
      cofins: 9.65,
      icmsImport: 12,
      icmsSale: 12,
      simplesNacional: 0,
      siscomexFixed: 0,
      isDefault: true,
    }
  });

  // 6. Default FinancialDistributionRule
  await prisma.financialDistributionRule.create({
    data: {
      name: "Regra Padrão Eleven Firearms",
      reinvestmentPct: 50,
      investorPct: 50,
      companyPct: 35,
      reservePct: 5,
      operationalCost: 15,
      salesCommission: 3,
      minBalanceNewPurchase: 50000,
      newBatchCriteria: "MANUAL",
      isActive: true,
    }
  });

  console.log("💎 Lógica Financeira Exata Semeada com Sucesso para Francisco!");
}

main()
  .catch((e) => { 
    console.error(e); 
    process.exit(1); 
  })
  .finally(async () => { 
    await prisma.$disconnect(); 
  });
