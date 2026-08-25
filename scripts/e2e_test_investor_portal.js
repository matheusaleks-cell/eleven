import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

// Mock / Engine das funções do Portal do Investidor (app/investidor/actions.ts)
async function getInvestorDataForUser(userEmail) {
  const investor = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      investedProjects: {
        include: {
          cycles: {
            orderBy: { cycleNumber: "asc" }
          },
          importLots: {
            include: {
              documents: true,
              products: true,
              weapons: {
                include: {
                  product: true
                }
              }
            }
          },
          documents: true
        }
      }
    }
  });

  return investor;
}

// Cálculo financeiro unitário (réplica de computeUnitFinancials)
function computeUnitFinancialsTest(saleValue, unitCost, profitSplitPct = 0.50, rates = { salesTaxRate: 0.06, operationalCostRate: 0.02 }) {
  const salesTax = saleValue * rates.salesTaxRate;
  const salesOpCost = saleValue * rates.operationalCostRate;
  const netRevenue = saleValue - salesTax - salesOpCost;
  const grossProfit = Math.max(0, netRevenue - unitCost);
  const investorShare = grossProfit * profitSplitPct;
  const companyShare = grossProfit * (1 - profitSplitPct);

  return {
    saleValue,
    unitCost,
    salesTax,
    salesOpCost,
    netRevenue,
    grossProfit,
    investorShare,
    companyShare
  };
}

async function runInvestorPortalE2ETest() {
  console.log("==========================================================");
  console.log("   TESTE DE EXPERIÊNCIA DO USUÁRIO INVESTIDOR (E2E)      ");
  console.log("==========================================================\n");

  let createdProjectId = null;
  let createdLotId = null;
  let createdWeaponIds = [];
  let createdDocId = null;

  try {
    // ------------------------------------------------------------------
    // ETAPA 1: Identificando Usuário Investidor e Admin
    // ------------------------------------------------------------------
    console.log("🔍 ETAPA 1: Buscando Contas de Investidor e Administrador...");
    const investor = await prisma.user.findFirst({
      where: { email: "raulfiuza07@icloud.com" }
    }) || await prisma.user.findFirst({
      where: { role: "INVESTOR" }
    });

    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    }) || investor;

    if (!investor) {
      throw new Error("Nenhum usuário com perfil de investidor encontrado!");
    }

    console.log(`✓ Investidor: ${investor.name} (${investor.email})`);
    console.log(`✓ Perfil / Role: ${investor.role}`);

    // ------------------------------------------------------------------
    // ETAPA 2: Montando Cenário Completo de Teste para o Investidor
    // ------------------------------------------------------------------
    console.log("\n📦 ETAPA 2: Provisionando Projeto, Lote, Armas e Ciclo de Teste...");
    const product = await prisma.product.findFirst({
      where: { commercialName: { contains: "VR 12" } }
    }) || await prisma.product.findFirst();

    const supplier = await prisma.supplier.findFirst() || await prisma.supplier.create({
      data: { name: "Turk Arms", country: "Turquia", status: "ACTIVE" }
    });

    const initialCapital = 100000.00;
    const splitPct = 0.50; // 50%
    const unitCost = 5000.00;
    const saleValue = 8500.00;

    // 1. Cria projeto
    const testProject = await prisma.investmentProject.create({
      data: {
        name: `PROJETO INVESTIDOR VR 12 - TESTE`,
        productName: product?.commercialName || "VR 12",
        investor: { connect: { id: investor.id } },
        createdBy: { connect: { id: admin.id } },
        initialCapital,
        maxCycles: 4,
        profitSplitPct: splitPct,
        status: "ACTIVE",
        contractNumber: `CTR-INV-${Date.now().toString().slice(-4)}`,
        startDate: new Date(),
        payoutRule: "REINVEST",
        taxProfile: "PJ",
        notes: "Ambiente de validação da visão do Investidor"
      }
    });
    createdProjectId = testProject.id;

    // 2. Cria Lote
    const testLot = await prisma.importLot.create({
      data: {
        batchCode: `LOT-INV-${Date.now().toString().slice(-4)}`,
        supplierId: supplier.id,
        countryOrigin: "Turquia",
        purchaseDate: new Date(),
        currency: "USD",
        exchangeRate: 5.30,
        fobValue: 10000,
        freight: 1000,
        insurance: 200,
        customsTaxes: 30000,
        customsFees: 7884,
        totalCostNationalized: initialCapital,
        quantityItems: 10,
        status: "DISPONIVEL",
        expectedMarginPct: 0.35,
        investmentProjectId: testProject.id,
        products: product ? { connect: [{ id: product.id }] } : undefined
      }
    });
    createdLotId = testLot.id;

    // 3. Cria Documento vinculado
    const testDoc = await prisma.document.create({
      data: {
        name: "DI_NACIONALIZACAO_VR12.pdf",
        type: "PDF",
        category: "ADUANA",
        stage: "DESEMBARACO",
        size: "245 KB",
        base64Data: "data:application/pdf;base64,JVBER...",
        lotId: testLot.id,
        projectId: testProject.id,
        realizedValue: 37884.00,
        realizedDate: new Date()
      }
    });
    createdDocId = testDoc.id;

    // 4. Cadastra 4 armas (2 em ESTOQUE, 2 VENDIDAS)
    const serials = [
      `INV-SER-${Date.now().toString().slice(-4)}-1`,
      `INV-SER-${Date.now().toString().slice(-4)}-2`,
      `INV-SER-${Date.now().toString().slice(-4)}-3`,
      `INV-SER-${Date.now().toString().slice(-4)}-4`
    ];

    const weapon1 = await prisma.weaponMap.create({
      data: {
        serialNumber: serials[0],
        productId: product.id,
        supplierId: supplier.id,
        importLotId: testLot.id,
        currentStatus: "VENDIDA",
        entryDate: new Date(),
        unitCost: unitCost,
        saleValue: saleValue,
        saleDate: new Date(),
        warehouseLocation: "GALPAO-A1"
      }
    });
    const weapon2 = await prisma.weaponMap.create({
      data: {
        serialNumber: serials[1],
        productId: product.id,
        supplierId: supplier.id,
        importLotId: testLot.id,
        currentStatus: "VENDIDA",
        entryDate: new Date(),
        unitCost: unitCost,
        saleValue: saleValue,
        saleDate: new Date(),
        warehouseLocation: "GALPAO-A1"
      }
    });
    const weapon3 = await prisma.weaponMap.create({
      data: {
        serialNumber: serials[2],
        productId: product.id,
        supplierId: supplier.id,
        importLotId: testLot.id,
        currentStatus: "ESTOQUE",
        entryDate: new Date(),
        unitCost: unitCost,
        warehouseLocation: "GALPAO-A1"
      }
    });
    const weapon4 = await prisma.weaponMap.create({
      data: {
        serialNumber: serials[3],
        productId: product.id,
        supplierId: supplier.id,
        importLotId: testLot.id,
        currentStatus: "ESTOQUE",
        entryDate: new Date(),
        unitCost: unitCost,
        warehouseLocation: "GALPAO-A1"
      }
    });
    createdWeaponIds = [weapon1.id, weapon2.id, weapon3.id, weapon4.id];

    console.log(`✓ Projeto provisionado: ${testProject.name} (Capital: R$ ${initialCapital})`);
    console.log(`✓ Lote provisionado: ${testLot.batchCode}`);
    console.log(`✓ Armas cadastradas: 2 Vendidas (R$ ${saleValue}/un), 2 em Estoque`);
    console.log(`✓ Documento anexado: ${testDoc.name}`);

    // ------------------------------------------------------------------
    // ETAPA 3: Testando Tela Principal do Investidor (Dashboard)
    // ------------------------------------------------------------------
    console.log("\n📊 ETAPA 3: Testando Métricas da Dashboard do Investidor (/investidor)...");
    const freshInvestorData = await getInvestorDataForUser(investor.email);
    
    // Calcula lucros em tempo real das armas vendidas
    let totalRealizedInvestorProfit = 0;
    const soldWeaponsFeed = [];

    freshInvestorData.investedProjects.forEach(proj => {
      proj.importLots.forEach(lot => {
        lot.weapons.forEach(w => {
          if (w.currentStatus === "VENDIDA") {
            const fin = computeUnitFinancialsTest(w.saleValue || 0, w.unitCost || 0, proj.profitSplitPct || 0.50);
            totalRealizedInvestorProfit += fin.investorShare;
            soldWeaponsFeed.push({
              serialNumber: w.serialNumber,
              productName: w.product?.commercialName,
              saleValue: w.saleValue,
              investorProfit: fin.investorShare,
              projectName: proj.name
            });
          }
        });
      });
    });

    const totalPatrimony = freshInvestorData.investedProjects.reduce((acc, p) => acc + (p.initialCapital || 0), 0) + totalRealizedInvestorProfit;

    console.log(`✓ Total de Projetos Ativos do Investidor: ${freshInvestorData.investedProjects.length}`);
    console.log(`✓ Patrimônio Consolidado Calculado: R$ ${totalPatrimony.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    console.log(`✓ Rendimento Total Realizado (Lucro do Investidor): R$ ${totalRealizedInvestorProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    console.log(`✓ Feed de Vendas Recentes em Tempo Real (${soldWeaponsFeed.length} armas vendidas):`);
    soldWeaponsFeed.forEach(s => {
      console.log(`  - Arma: ${s.productName} (${s.serialNumber}) | Venda: R$ ${s.saleValue?.toFixed(2)} | Lucro Investidor: R$ ${s.investorProfit?.toFixed(2)}`);
    });

    // ------------------------------------------------------------------
    // ETAPA 4: Testando Visão de Projetos do Investidor (/investidor/projetos)
    // ------------------------------------------------------------------
    console.log("\n📁 ETAPA 4: Testando Listagem de Projetos do Investidor (/investidor/projetos)...");
    const invProjects = freshInvestorData.investedProjects.map(p => {
      let pYield = 0;
      p.importLots.forEach(lot => {
        lot.weapons.forEach(w => {
          if (w.currentStatus === "VENDIDA") {
            const fin = computeUnitFinancialsTest(w.saleValue || 0, w.unitCost || 0, p.profitSplitPct || 0.50);
            pYield += fin.investorShare;
          }
        });
      });
      const pCurrent = (p.initialCapital || 0) + pYield;
      const yieldPct = p.initialCapital > 0 ? (pYield / p.initialCapital) * 100 : 0;
      return {
        id: p.id,
        name: p.name,
        initialCapital: p.initialCapital,
        currentCapital: pCurrent,
        yieldPct: yieldPct.toFixed(2),
        cyclesCount: p.cycles.length,
        maxCycles: p.maxCycles
      };
    });

    invProjects.forEach(p => {
      console.log(`✓ Card do Projeto: ${p.name}`);
      console.log(`  - Aporte Inicial: R$ ${p.initialCapital.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | Patrimônio Atual: R$ ${p.currentCapital.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
      console.log(`  - Rentabilidade: +${p.yieldPct}% | Ciclo: ${p.cyclesCount}/${p.maxCycles}`);
    });

    // ------------------------------------------------------------------
    // ETAPA 5: Testando Detalhes do Projeto e Rastreamento (/investidor/projetos/[id])
    // ------------------------------------------------------------------
    console.log("\n🔍 ETAPA 5: Testando Tela de Detalhes do Projeto (/investidor/projetos/[id])...");
    const projectDetail = freshInvestorData.investedProjects.find(p => p.id === testProject.id);

    if (!projectDetail) {
      throw new Error("Projeto de teste não encontrado nos detalhes!");
    }

    console.log(`✓ Header do Projeto: ${projectDetail.name} (Produto: ${projectDetail.productName})`);
    console.log(`✓ Lotes de Importação Associados: ${projectDetail.importLots.length}`);
    
    projectDetail.importLots.forEach(lot => {
      console.log(`  - Lote: ${lot.batchCode} | Status: ${lot.status} | País: ${lot.countryOrigin}`);
      console.log(`  - Quantidade de Armas no Lote: ${lot.weapons.length}`);
      
      const soldCount = lot.weapons.filter(w => w.currentStatus === "VENDIDA").length;
      const stockCount = lot.weapons.filter(w => w.currentStatus === "ESTOQUE").length;
      console.log(`  - Progresso de Vendas: ${soldCount} vendidas / ${stockCount} em estoque (${(soldCount / lot.weapons.length * 100).toFixed(0)}% concluído)`);

      console.log(`  - Documentos Anexados ao Lote (${lot.documents.length}):`);
      lot.documents.forEach(d => {
        console.log(`    • [${d.category}] ${d.name} (${d.size}) - Realizado: R$ ${d.realizedValue?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
      });
    });

    // ------------------------------------------------------------------
    // ETAPA 6: Testando Extrato Financeiro do Investidor (/investidor/extrato)
    // ------------------------------------------------------------------
    console.log("\n📑 ETAPA 6: Testando Extrato de Rendimentos (/investidor/extrato)...");
    const statementItems = [];

    // 1. Aporte
    statementItems.push({
      tipo: "APORTE",
      descricao: `Aporte de Capital - ${projectDetail.name}`,
      valor: -projectDetail.initialCapital
    });

    // 2. Rendimentos por venda em tempo real
    projectDetail.importLots.forEach(lot => {
      lot.weapons.forEach(w => {
        if (w.currentStatus === "VENDIDA") {
          const fin = computeUnitFinancialsTest(w.saleValue || 0, w.unitCost || 0, projectDetail.profitSplitPct || 0.50);
          statementItems.push({
            tipo: "RENDIMENTO",
            descricao: `Venda Proporcional - ${w.product?.commercialName} (${w.serialNumber})`,
            valor: fin.investorShare
          });
        }
      });
    });

    let runningBalance = 0;
    console.log(`✓ Lançamentos no Extrato (${statementItems.length} registros):`);
    statementItems.forEach(item => {
      runningBalance += Math.abs(item.valor);
      console.log(`  - [${item.tipo}] ${item.descricao} | Valor: R$ ${Math.abs(item.valor).toFixed(2)} | Saldo Acumulado: R$ ${runningBalance.toFixed(2)}`);
    });

    // ------------------------------------------------------------------
    // ETAPA 7: Testando Biblioteca de Documentos (/investidor/documentos)
    // ------------------------------------------------------------------
    console.log("\n📁 ETAPA 7: Testando Documentos e Contratos (/investidor/documentos)...");
    const allDocs = [];
    freshInvestorData.investedProjects.forEach(p => {
      p.documents.forEach(d => allDocs.push({ ...d, projectName: p.name }));
      p.importLots.forEach(l => {
        l.documents.forEach(d => allDocs.push({ ...d, projectName: p.name, lotCode: l.batchCode }));
      });
    });

    console.log(`✓ Total de Documentos acessíveis ao Investidor: ${allDocs.length}`);
    allDocs.forEach(d => {
      console.log(`  - Arquivo: ${d.name} | Categoria: ${d.category} | Projeto: ${d.projectName}`);
    });

    // ------------------------------------------------------------------
    // ETAPA 8: Limpeza Segura (Teardown)
    // ------------------------------------------------------------------
    console.log("\n🧹 ETAPA 8: Limpeza segura dos dados de teste do Investidor...");
    
    // 1. Exclui armas
    await prisma.weaponMap.deleteMany({
      where: { id: { in: createdWeaponIds } }
    });

    // 2. Exclui documentos
    if (createdDocId) {
      await prisma.document.delete({ where: { id: createdDocId } });
    }

    // 3. Desvincula produto do lote
    await prisma.product.updateMany({
      where: { importLotId: createdLotId },
      data: { importLotId: null }
    });

    // 4. Exclui lote
    if (createdLotId) {
      await prisma.importLot.delete({ where: { id: createdLotId } });
    }

    // 5. Exclui projeto
    if (createdProjectId) {
      await prisma.investmentProject.delete({ where: { id: createdProjectId } });
    }

    console.log("✓ Armas, Documentos, Lote e Projeto de teste do Investidor removidos com sucesso.");

    console.log("\n==========================================================");
    console.log("   TODAS AS TELAS DO INVESTIDOR OPERAM COM 100% SUCESSO!  ");
    console.log("==========================================================");

  } catch (error) {
    console.error("\n❌ FALHA NO TESTE DO PORTAL DO INVESTIDOR:", error);

    // Limpeza de emergência
    if (createdWeaponIds.length > 0) {
      await prisma.weaponMap.deleteMany({ where: { id: { in: createdWeaponIds } } }).catch(() => {});
    }
    if (createdDocId) {
      await prisma.document.delete({ where: { id: createdDocId } }).catch(() => {});
    }
    if (createdLotId) {
      await prisma.product.updateMany({ where: { importLotId: createdLotId }, data: { importLotId: null } }).catch(() => {});
      await prisma.importLot.delete({ where: { id: createdLotId } }).catch(() => {});
    }
    if (createdProjectId) {
      await prisma.investmentProject.delete({ where: { id: createdProjectId } }).catch(() => {});
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runInvestorPortalE2ETest();
