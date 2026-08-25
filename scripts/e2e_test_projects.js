import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

async function runProjectsE2ETest() {
  console.log("==========================================================");
  console.log("   TESTE DE FLUXO DE PONTA A PONTA (E2E) - PROJETOS       ");
  console.log("==========================================================\n");

  let createdProjectId = null;
  let autoLotIds = [];
  let testInvestor = null;
  let testAdmin = null;

  try {
    // ------------------------------------------------------------------
    // ETAPA 1: Verificação de Investidor e Administrador
    // ------------------------------------------------------------------
    console.log("🔍 ETAPA 1: Buscando Investidor e Administrador no sistema...");
    testInvestor = await prisma.user.findFirst({
      where: { role: "INVESTOR" }
    }) || await prisma.user.findFirst();

    testAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    }) || testInvestor;

    if (!testInvestor || !testAdmin) {
      throw new Error("Usuários necessários não encontrados no banco!");
    }

    console.log(`✓ Investidor: ${testInvestor.name} (${testInvestor.email})`);
    console.log(`✓ Administrador Criador: ${testAdmin.name} (${testAdmin.email})`);

    // ------------------------------------------------------------------
    // ETAPA 2: Criação do Projeto de Investimento com Lote Automático
    // ------------------------------------------------------------------
    console.log("\n📁 ETAPA 2: Criando Projeto de Investimento com lote e regras de payout...");
    const initialCapital = 150000.00; // R$ 150.000,00
    const maxCycles = 4;
    const profitSplitPct = 0.50; // 50%
    const contractNumber = `CTR-TEST-${Date.now().toString().slice(-4)}`;

    const project = await prisma.investmentProject.create({
      data: {
        name: `PROJETO TESTE VR 12 - ${contractNumber}`,
        productName: "VR 12",
        investorId: testInvestor.id,
        createdById: testAdmin.id,
        initialCapital,
        maxCycles,
        profitSplitPct,
        status: "ACTIVE",
        contractNumber,
        startDate: new Date(),
        payoutRule: "REINVEST",
        taxProfile: "PJ",
        bankAccount: "Banco Inter Ag 0001 CC 998877-6",
        pixKey: "investor@test.com",
        notes: "Projeto gerado para validação E2E automatizada."
      }
    });

    createdProjectId = project.id;
    console.log(`✓ Projeto criado com sucesso! ID: ${project.id} | Nome: ${project.name}`);
    console.log(`✓ Capital Inicial: R$ ${initialCapital.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | Split: ${(profitSplitPct * 100).toFixed(0)}% Investidor`);
    console.log(`✓ Regra de Payout: ${project.payoutRule} | Máximo de Ciclos: ${project.maxCycles}`);

    // Criação do Lote 1 associado ao Projeto
    const supplier = await prisma.supplier.findFirst() || await prisma.supplier.create({
      data: { name: "Turk Arms", country: "Turquia", status: "ACTIVE" }
    });

    const vr12Product = await prisma.product.findFirst({
      where: { commercialName: { contains: "VR 12" } }
    });

    const batchCode1 = `LOT-PROJ-1-${Date.now().toString().slice(-4)}`;
    const lot1 = await prisma.importLot.create({
      data: {
        batchCode: batchCode1,
        supplierId: supplier.id,
        countryOrigin: "Turquia",
        purchaseDate: new Date(),
        currency: "USD",
        exchangeRate: 5.30,
        fobValue: 15000,
        freight: 1200,
        insurance: 300,
        customsTaxes: 45000,
        customsFees: 7884,
        totalCostNationalized: initialCapital,
        quantityItems: 30,
        status: "PEDIDO_FEITO",
        expectedMarginPct: 0.35,
        investmentProjectId: project.id,
        products: vr12Product ? { connect: [{ id: vr12Product.id }] } : undefined
      }
    });

    autoLotIds.push(lot1.id);
    console.log(`✓ Lote 1 criado e vinculado ao projeto: ${lot1.batchCode} (Total Nacionalizado: R$ ${lot1.totalCostNationalized.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})`);

    // ------------------------------------------------------------------
    // ETAPA 3: Simulação de Receitas Realizadas das Armas do Projeto
    // ------------------------------------------------------------------
    console.log("\n💰 ETAPA 3: Verificando agregação financeira do projeto com armas físicas...");
    const projectSummary = await prisma.investmentProject.findUnique({
      where: { id: project.id },
      include: {
        investor: true,
        importLots: {
          include: { weapons: true }
        },
        cycles: true
      }
    });

    console.log(`✓ Projeto recuperado: ${projectSummary?.name}`);
    console.log(`✓ Quantidade de Lotes Vinculados: ${projectSummary?.importLots.length}`);
    console.log(`✓ Status atual do Projeto: ${projectSummary?.status}`);

    // ------------------------------------------------------------------
    // ETAPA 4: Fechamento do Ciclo 1 & Apuração Fiscal
    // ------------------------------------------------------------------
    console.log("\n📊 ETAPA 4: Registrando fechamento do Ciclo 1 com apuração contábil...");
    const grossRevenue = 225000.00;
    const customsValueBrl = initialCapital;
    const salesTax = grossRevenue * 0.06; // Simples Nacional ~6%
    const salesOpCost = 4500.00;
    const netRevenue = grossRevenue - salesTax - salesOpCost;
    const grossProfit = netRevenue - customsValueBrl;
    const investorShare = grossProfit * profitSplitPct;
    const companyShare = grossProfit * (1 - profitSplitPct);
    const nextCycleCapital = customsValueBrl + investorShare; // Capital reinvestido

    const cycle1 = await prisma.cycle.create({
      data: {
        projectId: project.id,
        cycleNumber: 1,
        cycleName: "Ciclo 1 - Lote Turquia 30x VR 12",
        status: "COMPLETED",
        importLotId: lot1.id,
        quantity: 30,
        salePricePerUnit: 7500.00,
        exchangeRateUsd: 5.30,
        fobValueUsd: 15000.00,
        freightUsd: 1200.00,
        insuranceUsd: 300.00,
        customsValueBrl: customsValueBrl,
        iiTax: 15000,
        ipiTax: 25000,
        afrmmTax: 0,
        capatazia: 0,
        pisPasepTax: 2000,
        cofinsTax: 8000,
        siscomexFee: 154.23,
        icmsSt: 0,
        simplesTax: salesTax,
        operationalCost: 7884.00,
        calcBaseNormal: 120000,
        icmsBaseAltered: 145000,
        icmsImportTax: 36250,
        totalInvestment: customsValueBrl,
        grossRevenue,
        salesTax,
        salesOperationalCost: salesOpCost,
        netRevenue,
        grossProfit,
        investorShare,
        companyShare,
        reserveShare: 0,
        reinvestmentShare: nextCycleCapital
      }
    });

    console.log(`✓ Ciclo 1 registrado com sucesso! ID: ${cycle1.id}`);
    console.log(`✓ Receita Bruta: R$ ${grossRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    console.log(`✓ Lucro Líquido a Dividir: R$ ${grossProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    console.log(`✓ Parcela do Investidor (50%): R$ ${investorShare.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    console.log(`✓ Parcela da Eleven (50%): R$ ${companyShare.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    console.log(`✓ Próximo Capital de Reinvestimento: R$ ${nextCycleCapital.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);

    // Atualiza status do Lote 1 para LIQUIDADO
    await prisma.importLot.update({
      where: { id: lot1.id },
      data: { status: "LIQUIDADO" }
    });
    console.log(`✓ Status do Lote 1 atualizado para 'LIQUIDADO'.`);

    // ------------------------------------------------------------------
    // ETAPA 5: Reinvestimento e Abertura Automática do Próximo Lote (Ciclo 2)
    // ------------------------------------------------------------------
    console.log("\n🔄 ETAPA 5: Executando abertura automática do próximo lote para Ciclo 2...");
    const batchCode2 = `LOT-PROJ-2-${Date.now().toString().slice(-4)}`;
    const estimatedFobUsd2 = (nextCycleCapital / 1.48) / 5.30;

    const lot2 = await prisma.importLot.create({
      data: {
        batchCode: batchCode2,
        supplierId: supplier.id,
        countryOrigin: "Turquia",
        purchaseDate: new Date(),
        currency: "USD",
        exchangeRate: 5.30,
        fobValue: estimatedFobUsd2,
        freight: 0,
        insurance: 0,
        customsTaxes: nextCycleCapital * 0.40,
        customsFees: 7884,
        totalCostNationalized: nextCycleCapital,
        quantityItems: 35, // Poder de compra aumentado pelo reinvestimento
        status: "PEDIDO_FEITO",
        expectedMarginPct: 0.35,
        investmentProjectId: project.id,
        products: vr12Product ? { connect: [{ id: vr12Product.id }] } : undefined
      }
    });

    autoLotIds.push(lot2.id);
    console.log(`✓ Lote 2 criado automaticamente com o capital reinvestido!`);
    console.log(`✓ Código do Lote 2: ${lot2.batchCode} | Status: ${lot2.status}`);
    console.log(`✓ Novo Capital Nacionalizado: R$ ${nextCycleCapital.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (Capacidade: 35 unidades)`);

    // ------------------------------------------------------------------
    // ETAPA 6: Verificação de Integridade e Painel Geral de Projetos
    // ------------------------------------------------------------------
    console.log("\n📈 ETAPA 6: Verificando métricas consolidadas do projeto...");
    const projectWithAllCycles = await prisma.investmentProject.findUnique({
      where: { id: project.id },
      include: {
        cycles: true,
        importLots: true
      }
    });

    console.log(`✓ Total de Ciclos Finalizados: ${projectWithAllCycles?.cycles.length}/${project.maxCycles}`);
    console.log(`✓ Total de Lotes Vinculados no Histórico: ${projectWithAllCycles?.importLots.length}`);
    console.log(`✓ Lote 1 Status: ${projectWithAllCycles?.importLots[0]?.status}`);
    console.log(`✓ Lote 2 Status: ${projectWithAllCycles?.importLots[1]?.status}`);

    if (projectWithAllCycles?.cycles.length !== 1 || projectWithAllCycles?.importLots.length !== 2) {
      throw new Error("Inconsistência na contagem de ciclos ou lotes!");
    }

    // ------------------------------------------------------------------
    // ETAPA 7: Limpeza / Teardown Seguro
    // ------------------------------------------------------------------
    console.log("\n🧹 ETAPA 7: Executando limpeza segura do teste e desvinculando registros...");

    // 1. Exclui ciclos
    await prisma.cycle.deleteMany({
      where: { projectId: project.id }
    });

    // 2. Desvincula produtos dos lotes antes de excluir
    await prisma.product.updateMany({
      where: { importLotId: { in: autoLotIds } },
      data: { importLotId: null }
    });

    // 3. Exclui lotes
    await prisma.importLot.deleteMany({
      where: { id: { in: autoLotIds } }
    });

    // 4. Exclui projeto
    await prisma.investmentProject.delete({
      where: { id: project.id }
    });

    console.log("✓ Ciclos e Lotes de teste excluídos.");
    console.log("✓ Projeto de investimento de teste removido.");

    console.log("\n==========================================================");
    console.log("     TODOS OS TESTES DE PROJETOS PASSARAM COM SUCESSO!    ");
    console.log("==========================================================");

  } catch (error) {
    console.error("\n❌ FALHA NO TESTE E2E DE PROJETOS:", error);

    // Limpeza de emergência
    if (createdProjectId) {
      await prisma.cycle.deleteMany({ where: { projectId: createdProjectId } }).catch(() => {});
      await prisma.product.updateMany({ where: { importLotId: { in: autoLotIds } }, data: { importLotId: null } }).catch(() => {});
      await prisma.importLot.deleteMany({ where: { id: { in: autoLotIds } } }).catch(() => {});
      await prisma.investmentProject.delete({ where: { id: createdProjectId } }).catch(() => {});
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runProjectsE2ETest();
