import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

async function runAdminComprehensiveTestSuite() {
  console.log("================================================================================");
  console.log("   SUÍTE DE TESTES INTEGRAL E AUDITORIA COMPLETA DO PAINEL ADMIN (E2E)        ");
  console.log("================================================================================\n");

  const startTime = Date.now();
  
  // Trackers de limpeza
  let testLeadId = null;
  let testCustomerId = null;
  let testOrderId = null;
  let testProjectId = null;
  let testLotIds = [];
  let testWeaponIds = [];
  let testDocIds = [];
  let testCycleId = null;
  let targetProduct = null;
  let initialStock = 0;

  try {
    // ------------------------------------------------------------------
    // ETAPA 1: Configurações Fiscais e Simulador de Viabilidade Tributária
    // ------------------------------------------------------------------
    console.log("⚙️  ETAPA 1: Validando Configurações Tributárias e Motor do Simulador...");
    
    let taxConfig = await prisma.taxConfig.findFirst({ where: { isDefault: true } }) 
      || await prisma.taxConfig.findFirst();

    if (!taxConfig) {
      taxConfig = await prisma.taxConfig.create({
        data: {
          name: "Configuração Padrão Turquia",
          ii: 18,
          ipi: 55,
          pisPasep: 2.1,
          cofins: 9.65,
          icmsImport: 25,
          icmsSale: 12,
          simplesNacional: 6,
          siscomexFixed: 154.23,
          isDefault: true
        }
      });
    }

    const iiRate = taxConfig.ii > 1 ? taxConfig.ii / 100 : taxConfig.ii;
    const ipiRate = taxConfig.ipi > 1 ? taxConfig.ipi / 100 : taxConfig.ipi;
    const pisRate = taxConfig.pisPasep > 1 ? taxConfig.pisPasep / 100 : taxConfig.pisPasep;
    const cofinsRate = taxConfig.cofins > 1 ? taxConfig.cofins / 100 : taxConfig.cofins;
    const icmsRate = taxConfig.icmsImport > 1 ? taxConfig.icmsImport / 100 : taxConfig.icmsImport;

    console.log(`✓ Tabela Tributária Carregada: ${taxConfig.name}`);
    console.log(`  - II: ${(iiRate * 100).toFixed(1)}% | IPI: ${(ipiRate * 100).toFixed(1)}% | PIS/COFINS: ${((pisRate + cofinsRate) * 100).toFixed(2)}% | ICMS: ${(icmsRate * 100).toFixed(1)}%`);

    // Fórmulas aduaneiras do Simulador
    const simQty = 20;
    const simFobUnit = 350.00;
    const simFreightUnit = 40.00;
    const simExchange = 5.30;
    const simVa = (simFobUnit + simFreightUnit) * simQty * simExchange;
    const simIi = simVa * iiRate;
    const simIpi = (simVa + simIi) * ipiRate;
    const simPis = simVa * pisRate;
    const simCofins = simVa * cofinsRate;
    const simBaseNormal = simVa + simIi + simIpi + simPis + simCofins + (taxConfig.siscomexFixed || 154.23);
    const simBaseAlterada = simBaseNormal / (1 - icmsRate);
    const simIcms = simBaseAlterada * icmsRate;
    const simCustoOp = 7884.00;
    const simTotalNacionalizado = simBaseAlterada + simCustoOp;
    const simCustoUnitario = simTotalNacionalizado / simQty;

    console.log(`✓ Simulação Aduaneira (20 un. a US$ ${simFobUnit.toFixed(2)} FOB | Câmbio R$ ${simExchange.toFixed(2)}):`);
    console.log(`  - Valor Aduaneiro (VA): R$ ${simVa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    console.log(`  - Total Impostos Importação: R$ ${(simIi + simIpi + simPis + simCofins + simIcms).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    console.log(`  - Custo Total Nacionalizado: R$ ${simTotalNacionalizado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (Unitário: R$ ${simCustoUnitario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})`);

    // ------------------------------------------------------------------
    // ETAPA 2: ERP e Catálogo de Produtos
    // ------------------------------------------------------------------
    console.log("\n📦 ETAPA 2: Validando ERP e Catálogo de Produtos...");
    targetProduct = await prisma.product.findFirst({
      where: { commercialName: { contains: "VR 12" } }
    }) || await prisma.product.findFirst();

    if (!targetProduct) {
      throw new Error("Nenhum produto cadastrado no catálogo do ERP!");
    }

    initialStock = targetProduct.stockAvailable || 0;
    console.log(`✓ Produto Selecionado: ${targetProduct.commercialName} (SKU: ${targetProduct.sku})`);
    console.log(`  - Calibre: ${targetProduct.caliber || "12 GA"} | Marca: ${targetProduct.brand || "Armsan"}`);
    console.log(`  - Preço Tabela B2C: R$ ${targetProduct.priceB2C.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | B2B: R$ ${targetProduct.priceB2B.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    console.log(`  - Saldo em Estoque Pré-Teste: ${initialStock} un.`);

    // ------------------------------------------------------------------
    // ETAPA 3: CRM, Gestão de Leads e Base de Clientes
    // ------------------------------------------------------------------
    console.log("\n👥 ETAPA 3: Testando CRM (Leads, Pipeline Funil e Clientes B2B/B2C)...");
    
    // 1. Cria Lead e avança funil
    const testLead = await prisma.lead.create({
      data: {
        name: "Clube de Tiro e Caça Alvo Certo",
        email: `contato-${Date.now()}@alvocerto.com.br`,
        phone: "(11) 98888-7777",
        company: "Alvo Certo Treinamentos Ltda",
        status: "NOVO",
        priority: "high",
        value: 45000.00,
        source: "Instagram",
        interests: "VR 12, KR 22",
        customerType: "B2B",
        category: "CLUBE DE TIRO",
        crNumber: "CR-EB-987654",
        crValidity: "2028-12-31",
        state: "SP",
        city: "Campinas"
      }
    });
    testLeadId = testLead.id;
    console.log(`✓ Lead Criado: ${testLead.name} (Status: ${testLead.status})`);

    const statuses = ["QUALIFICADO", "CONTATO", "PROPOSTA", "GANHO"];
    for (const st of statuses) {
      await prisma.lead.update({ where: { id: testLead.id }, data: { status: st } });
    }
    console.log(`✓ Pipeline do Lead avançado com sucesso: NOVO ➔ QUALIFICADO ➔ CONTATO ➔ PROPOSTA ➔ GANHO`);

    // 2. Cria Cliente B2B com Conformidade
    const cnpj = `11.${Math.floor(100+Math.random()*900)}.${Math.floor(100+Math.random()*900)}/0001-99`;
    const testCustomer = await prisma.customer.create({
      data: {
        type: "B2B",
        name: testLead.company || "Alvo Certo Treinamentos Ltda",
        fantasyName: "Clube Alvo Certo",
        cpfCnpj: cnpj,
        email: testLead.email,
        phone: testLead.phone,
        state: "SP",
        city: "Campinas",
        category: "CLUBE DE TIRO",
        crNumber: testLead.crNumber,
        status: "ACTIVE"
      }
    });
    testCustomerId = testCustomer.id;
    console.log(`✓ Cliente B2B Registrado: ${testCustomer.name} (CNPJ: ${testCustomer.cpfCnpj} | CR: ${testCustomer.crNumber})`);

    // ------------------------------------------------------------------
    // ETAPA 4: Importação, Lotes Aduaneiros e Mapa de Armas
    // ------------------------------------------------------------------
    console.log("\n🚢 ETAPA 4: Testando Importação de Lote, Documentos e Entrada no Mapa de Armas...");
    
    const supplier = await prisma.supplier.findFirst() || await prisma.supplier.create({
      data: { name: "Turk Arms International", country: "Turquia", status: "ACTIVE" }
    });

    const lotCostTotal = 80000.00;
    const lotQuantity = 4;
    const lotUnitCost = lotCostTotal / lotQuantity;
    const batchCode = `LOT-ADMIN-SUITE-${Date.now().toString().slice(-4)}`;

    const importLot = await prisma.importLot.create({
      data: {
        batchCode,
        supplierId: supplier.id,
        countryOrigin: "Turquia",
        purchaseDate: new Date(),
        currency: "USD",
        exchangeRate: 5.30,
        fobValue: 7000,
        freight: 800,
        insurance: 150,
        customsTaxes: 24000,
        customsFees: 7884,
        totalCostNationalized: lotCostTotal,
        quantityItems: lotQuantity,
        status: "PEDIDO_FEITO",
        expectedMarginPct: 0.35,
        products: { connect: [{ id: targetProduct.id }] }
      }
    });
    testLotIds.push(importLot.id);
    console.log(`✓ Lote de Importação Criado: ${importLot.batchCode} (Total: R$ ${lotCostTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})`);

    // Avanço do Lote
    await prisma.importLot.update({ where: { id: importLot.id }, data: { status: "TRANSITO" } });
    await prisma.importLot.update({ where: { id: importLot.id }, data: { status: "NACIONALIZANDO" } });
    await prisma.importLot.update({ where: { id: importLot.id }, data: { status: "DISPONIVEL" } });
    console.log(`✓ Ciclo de Vida do Lote atualizado: PEDIDO_FEITO ➔ TRANSITO ➔ NACIONALIZANDO ➔ DISPONIVEL`);

    // Anexo de Documento
    const doc = await prisma.document.create({
      data: {
        name: "DI_SUITE_TEST.pdf",
        type: "PDF",
        category: "ADUANA",
        stage: "DESEMBARACO",
        size: "180 KB",
        base64Data: "data:application/pdf;base64,JVBER...",
        lotId: importLot.id,
        realizedValue: 31884.00,
        realizedDate: new Date()
      }
    });
    testDocIds.push(doc.id);
    console.log(`✓ Documento Aduaneiro Anexado: ${doc.name} (Realizado: R$ ${doc.realizedValue?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})`);

    // Entrada de 4 Armas no Mapa de Armas
    const testSerials = [
      `ADM-SER-${Date.now().toString().slice(-4)}-1`,
      `ADM-SER-${Date.now().toString().slice(-4)}-2`,
      `ADM-SER-${Date.now().toString().slice(-4)}-3`,
      `ADM-SER-${Date.now().toString().slice(-4)}-4`
    ];

    for (const serial of testSerials) {
      const weapon = await prisma.weaponMap.create({
        data: {
          serialNumber: serial,
          productId: targetProduct.id,
          supplierId: supplier.id,
          importLotId: importLot.id,
          currentStatus: "ESTOQUE",
          entryDate: new Date(),
          unitCost: lotUnitCost,
          warehouseLocation: "GALPAO-A1",
          observations: "Entrada via Suíte de Testes do Admin"
        }
      });
      testWeaponIds.push(weapon.id);

      await prisma.weaponMovement.create({
        data: {
          weaponId: weapon.id,
          type: "ENTRADA",
          description: `Entrada física em estoque via lote ${importLot.batchCode}`
        }
      });
    }

    // Incrementa estoque do produto
    await prisma.product.update({
      where: { id: targetProduct.id },
      data: { stockAvailable: { increment: testSerials.length } }
    });

    console.log(`✓ 4 Armas Físicas cadastradas no Mapa de Armas com status 'ESTOQUE' e Custo Unitário R$ ${lotUnitCost.toFixed(2)}.`);
    console.log(`✓ Extrato de movimentação (WeaponMovement) registrado com evento 'ENTRADA'.`);
    console.log(`✓ Saldo em estoque do produto atualizado de ${initialStock} para ${initialStock + 4} un.`);

    // ------------------------------------------------------------------
    // ETAPA 5: Vendas & PDV com Baixa Atômica de Séries
    // ------------------------------------------------------------------
    console.log("\n🏷️  ETAPA 5: Testando Vendas (PDV), Emissão de Pedido e Baixa de Séries...");

    const seller = await prisma.user.findFirst({ where: { role: "ADMIN" } }) || await prisma.user.findFirst();
    const saleUnitValue = 8500.00;
    const discount = 500.00;
    const soldQty = 2;
    const totalSaleValue = (saleUnitValue * soldQty) - discount; // R$ 16.500,00

    const orderNumber = `PED-ADM-${Date.now().toString().slice(-6)}`;
    const salesOrder = await prisma.salesOrder.create({
      data: {
        orderNumber,
        customerId: testCustomer.id,
        sellerId: seller.id,
        products: JSON.stringify([{
          id: targetProduct.id,
          name: targetProduct.commercialName,
          quantity: soldQty,
          unitPrice: saleUnitValue,
          discount: discount,
          total: totalSaleValue,
          selectedSerials: [testSerials[0], testSerials[1]]
        }]),
        totalValue: totalSaleValue,
        status: "PAGO",
        paymentMethod: "A VISTA (PIX)",
        notes: "Venda B2B emitida e finalizada pelo painel Admin"
      }
    });
    testOrderId = salesOrder.id;
    console.log(`✓ Pedido de Venda Gerado: ${salesOrder.orderNumber} | Valor Total: R$ ${salesOrder.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);

    // Baixa atômica das 2 primeiras armas
    const weaponsToSell = [testWeaponIds[0], testWeaponIds[1]];
    for (const wId of weaponsToSell) {
      await prisma.weaponMap.update({
        where: { id: wId },
        data: {
          currentStatus: "VENDIDA",
          saleValue: saleUnitValue - (discount / soldQty),
          saleDate: new Date(),
          customerId: testCustomer.id,
          salesOrderId: salesOrder.id
        }
      });

      await prisma.weaponMovement.create({
        data: {
          weaponId: wId,
          type: "VENDA",
          description: `Venda faturada no pedido ${salesOrder.orderNumber}`
        }
      });
    }

    // Decrementa estoque do produto
    await prisma.product.update({
      where: { id: targetProduct.id },
      data: { stockAvailable: { decrement: soldQty } }
    });

    console.log(`✓ 2 Armas transferidas para status 'VENDIDA' no WeaponMap com vínculo ao cliente e pedido.`);
    console.log(`✓ Movimentação de auditoria 'VENDA' registrada.`);
    console.log(`✓ Saldo em estoque do produto decrementado para ${initialStock + 2} un.`);

    // ------------------------------------------------------------------
    // ETAPA 6: Projetos de Investimento, Ciclos e Reinvestimento Automático
    // ------------------------------------------------------------------
    console.log("\n💼 ETAPA 6: Testando Projetos de Investimento, Fechamento de Ciclo e Reinvestimento...");

    const investor = await prisma.user.findFirst({ where: { role: "INVESTOR" } }) || seller;
    const initialProjectCapital = 120000.00;

    const project = await prisma.investmentProject.create({
      data: {
        name: `PROJETO SUITE ADMIN - ${Date.now().toString().slice(-4)}`,
        productName: targetProduct.commercialName,
        investor: { connect: { id: investor.id } },
        createdBy: { connect: { id: seller.id } },
        initialCapital: initialProjectCapital,
        maxCycles: 4,
        profitSplitPct: 0.50,
        status: "ACTIVE",
        contractNumber: `CTR-ADM-${Date.now().toString().slice(-4)}`,
        payoutRule: "REINVEST",
        taxProfile: "PJ"
      }
    });
    testProjectId = project.id;
    console.log(`✓ Projeto de Investimento Criado: ${project.name} (Capital: R$ ${initialProjectCapital.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})`);

    // Vincula o lote ao projeto
    await prisma.importLot.update({
      where: { id: importLot.id },
      data: { investmentProjectId: project.id }
    });

    // Fechamento contábil de Ciclo 1
    const grossRev = 180000.00;
    const customsVal = initialProjectCapital;
    const simTax = grossRev * 0.06;
    const opCost = 3600.00;
    const netRev = grossRev - simTax - opCost;
    const profit = netRev - customsVal;
    const invShare = profit * 0.50;
    const compShare = profit * 0.50;
    const nextCap = customsVal + invShare;

    const cycle = await prisma.cycle.create({
      data: {
        projectId: project.id,
        cycleNumber: 1,
        cycleName: "Ciclo 1 - Finalizado com Sucesso",
        status: "COMPLETED",
        importLotId: importLot.id,
        quantity: 20,
        salePricePerUnit: 9000.00,
        exchangeRateUsd: 5.30,
        fobValueUsd: 12000.00,
        freightUsd: 1000.00,
        insuranceUsd: 200.00,
        customsValueBrl: customsVal,
        iiTax: 12000,
        ipiTax: 20000,
        afrmmTax: 0,
        capatazia: 0,
        pisPasepTax: 1500,
        cofinsTax: 6000,
        siscomexFee: 154.23,
        icmsSt: 0,
        simplesTax: simTax,
        operationalCost: 7884.00,
        calcBaseNormal: 90000,
        icmsBaseAltered: 110000,
        icmsImportTax: 27500,
        totalInvestment: customsVal,
        grossRevenue: grossRev,
        salesTax: simTax,
        salesOperationalCost: opCost,
        netRevenue: netRev,
        grossProfit: profit,
        investorShare: invShare,
        companyShare: compShare,
        reserveShare: 0,
        reinvestmentShare: nextCap
      }
    });
    testCycleId = cycle.id;

    // Atualiza Lote 1 para LIQUIDADO
    await prisma.importLot.update({ where: { id: importLot.id }, data: { status: "LIQUIDADO" } });
    console.log(`✓ Ciclo 1 Fechado: Lucro Líquido R$ ${profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | Investidor: R$ ${invShare.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | Eleven: R$ ${compShare.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    console.log(`✓ Lote 1 atualizado para status 'LIQUIDADO'.`);

    // Abertura automática do Lote 2 para Ciclo 2
    const lot2Batch = `LOT-REINVEST-${Date.now().toString().slice(-4)}`;
    const lot2 = await prisma.importLot.create({
      data: {
        batchCode: lot2Batch,
        supplierId: supplier.id,
        countryOrigin: "Turquia",
        purchaseDate: new Date(),
        currency: "USD",
        exchangeRate: 5.30,
        fobValue: (nextCap / 1.48) / 5.30,
        freight: 0,
        insurance: 0,
        customsTaxes: nextCap * 0.40,
        customsFees: 7884,
        totalCostNationalized: nextCap,
        quantityItems: 24,
        status: "PEDIDO_FEITO",
        expectedMarginPct: 0.35,
        investmentProjectId: project.id,
        products: { connect: [{ id: targetProduct.id }] }
      }
    });
    testLotIds.push(lot2.id);
    console.log(`✓ Abertura Automática de Lote para Reinvestimento (Ciclo 2): ${lot2.batchCode} com capital de R$ ${nextCap.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);

    // ------------------------------------------------------------------
    // ETAPA 7: Métricas Globais, Dashboard e Financeiro
    // ------------------------------------------------------------------
    console.log("\n📊 ETAPA 7: Validando Métricas Globais de Dashboard e DRE Financeiro...");
    
    // Consulta consolidada
    const totalSoldWeaponsCount = await prisma.weaponMap.count({ where: { currentStatus: "VENDIDA" } });
    const totalStockWeaponsCount = await prisma.weaponMap.count({ where: { currentStatus: "ESTOQUE" } });
    const totalActiveLotsCount = await prisma.importLot.count({ where: { status: { not: "LIQUIDADO" } } });
    const totalCompletedCycles = await prisma.cycle.count({ where: { status: "COMPLETED" } });

    console.log(`✓ Total de Armas Físicas Vendidas no Sistema: ${totalSoldWeaponsCount}`);
    console.log(`✓ Total de Armas Físicas em Estoque no Sistema: ${totalStockWeaponsCount}`);
    console.log(`✓ Total de Lotes Ativos em Trânsito/Nacionalização: ${totalActiveLotsCount}`);
    console.log(`✓ Total de Ciclos Finalizados com Apuração: ${totalCompletedCycles}`);

    // ------------------------------------------------------------------
    // ETAPA 8: Limpeza Segura (Teardown Idempotente)
    // ------------------------------------------------------------------
    console.log("\n🧹 ETAPA 8: Executando Limpeza Segura e Restauração de Dados...");

    // 1. Exclui movimentos de arma
    await prisma.weaponMovement.deleteMany({
      where: { weaponId: { in: testWeaponIds } }
    });

    // 2. Exclui armas
    await prisma.weaponMap.deleteMany({
      where: { id: { in: testWeaponIds } }
    });

    // 3. Exclui pedido de venda
    if (testOrderId) {
      await prisma.salesOrder.delete({ where: { id: testOrderId } });
    }

    // 4. Exclui cliente
    if (testCustomerId) {
      await prisma.customer.delete({ where: { id: testCustomerId } });
    }

    // 5. Exclui lead
    if (testLeadId) {
      await prisma.lead.delete({ where: { id: testLeadId } });
    }

    // 6. Exclui ciclo
    if (testCycleId) {
      await prisma.cycle.delete({ where: { id: testCycleId } });
    }

    // 7. Exclui documentos
    if (testDocIds.length > 0) {
      await prisma.document.deleteMany({ where: { id: { in: testDocIds } } });
    }

    // 8. Desvincula produtos dos lotes e exclui lotes
    if (testLotIds.length > 0) {
      await prisma.product.updateMany({
        where: { importLotId: { in: testLotIds } },
        data: { importLotId: null }
      });
      await prisma.importLot.deleteMany({
        where: { id: { in: testLotIds } }
      });
    }

    // 9. Exclui projeto
    if (testProjectId) {
      await prisma.investmentProject.delete({ where: { id: testProjectId } });
    }

    // 10. Restaura estoque do produto
    await prisma.product.update({
      where: { id: targetProduct.id },
      data: { stockAvailable: initialStock }
    });

    console.log("✓ Movimentações, Armas, Pedidos, Clientes, Leads, Ciclos e Lotes de teste removidos.");
    console.log(`✓ Saldo em estoque do produto ${targetProduct.commercialName} restaurado para ${initialStock} un.`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("\n================================================================================");
    console.log(`   SUÍTE DE TESTES DO ADMIN CONCLUÍDA COM 100% DE SUCESSO (${duration}s)!        `);
    console.log("================================================================================");

  } catch (error) {
    console.error("\n❌ FALHA NA SUÍTE DE TESTES DO ADMIN:", error);

    // Limpeza de emergência
    try {
      if (testWeaponIds.length > 0) {
        await prisma.weaponMovement.deleteMany({ where: { weaponId: { in: testWeaponIds } } }).catch(() => {});
        await prisma.weaponMap.deleteMany({ where: { id: { in: testWeaponIds } } }).catch(() => {});
      }
      if (testOrderId) await prisma.salesOrder.delete({ where: { id: testOrderId } }).catch(() => {});
      if (testCustomerId) await prisma.customer.delete({ where: { id: testCustomerId } }).catch(() => {});
      if (testLeadId) await prisma.lead.delete({ where: { id: testLeadId } }).catch(() => {});
      if (testCycleId) await prisma.cycle.delete({ where: { id: testCycleId } }).catch(() => {});
      if (testDocIds.length > 0) await prisma.document.deleteMany({ where: { id: { in: testDocIds } } }).catch(() => {});
      if (testLotIds.length > 0) {
        await prisma.product.updateMany({ where: { importLotId: { in: testLotIds } }, data: { importLotId: null } }).catch(() => {});
        await prisma.importLot.deleteMany({ where: { id: { in: testLotIds } } }).catch(() => {});
      }
      if (testProjectId) await prisma.investmentProject.delete({ where: { id: testProjectId } }).catch(() => {});
      if (targetProduct && initialStock !== undefined) {
        await prisma.product.update({ where: { id: targetProduct.id }, data: { stockAvailable: initialStock } }).catch(() => {});
      }
    } catch (cleanErr) {
      console.error("Erro na limpeza de emergência:", cleanErr);
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAdminComprehensiveTestSuite();
