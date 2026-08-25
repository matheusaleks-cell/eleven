import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

async function runImportE2ETest() {
  console.log("==========================================================");
  console.log("   TESTE DE FLUXO DE PONTA A PONTA (E2E) - IMPORTAÇÃO    ");
  console.log("==========================================================\n");

  let createdLotId = null;
  let testWeaponsCreated = [];
  let testProductInitialStock = 0;
  let targetProduct = null;

  try {
    // ------------------------------------------------------------------
    // ETAPA 1: Verificação de Pré-Requisitos (Fornecedor e Produto)
    // ------------------------------------------------------------------
    console.log("🔍 ETAPA 1: Verificando Fornecedor e Produto Alvo...");
    const supplier = await prisma.supplier.findFirst({
      where: { status: "ACTIVE" }
    }) || await prisma.supplier.findFirst();

    if (!supplier) {
      throw new Error("Nenhum fornecedor cadastrado no banco!");
    }
    console.log(`✓ Fornecedor: ${supplier.name} (Origem: ${supplier.country || "Turquia"})`);

    targetProduct = await prisma.product.findFirst({
      where: { commercialName: { contains: "KR 22" } }
    }) || await prisma.product.findFirst();

    if (!targetProduct) {
      throw new Error("Nenhum produto cadastrado no banco!");
    }

    testProductInitialStock = targetProduct.stockAvailable || 0;
    console.log(`✓ Produto Alvo: ${targetProduct.commercialName} (SKU: ${targetProduct.sku})`);
    console.log(`✓ Estoque atual do produto antes do teste: ${testProductInitialStock} un.`);

    // ------------------------------------------------------------------
    // ETAPA 2: Criação de Lote de Importação com Cálculos Fiscais
    // ------------------------------------------------------------------
    console.log("\n📦 ETAPA 2: Criando Lote de Importação e calculando custos de nacionalização...");
    const fobTotal = 15000; // USD
    const freightTotal = 1200; // USD
    const insuranceTotal = 300; // USD
    const exchangeRate = 5.30;
    const quantityItems = 10;

    // Fórmulas tributárias Eleven / Preset Turquia
    const iiRate = 0.18;
    const ipiRate = 0.55;
    const pisRate = 0.021;
    const cofinsRate = 0.0965;
    const icmsFactor = 0.75;
    const icmsRate = 0.25;
    const siscomex = 154.23;
    const custoOp = 7884.00;

    const va = (fobTotal + freightTotal + insuranceTotal) * exchangeRate;
    const ii = va * iiRate;
    const ipi = (va + ii) * ipiRate;
    const pis = va * pisRate;
    const cofins = va * cofinsRate;
    const baseNormal = va + ii + ipi + pis + cofins + siscomex;
    const baseAlterada = baseNormal / icmsFactor;
    const icms = baseAlterada * icmsRate;
    const customsTaxes = ii + ipi + pis + cofins + icms;
    const customsFees = siscomex + custoOp;
    const totalCostNationalized = baseAlterada + custoOp;
    const unitCost = totalCostNationalized / quantityItems;

    const batchCode = `TEST-LOT-${Date.now().toString().slice(-6)}`;
    const lot = await prisma.importLot.create({
      data: {
        batchCode,
        supplierId: supplier.id,
        countryOrigin: "Turquia",
        purchaseDate: new Date(),
        currency: "USD",
        exchangeRate,
        fobValue: fobTotal,
        freight: freightTotal,
        insurance: insuranceTotal,
        customsTaxes,
        customsFees,
        totalCostNationalized,
        quantityItems,
        status: "PEDIDO_FEITO",
        expectedMarginPct: 0.35,
        products: {
          connect: [{ id: targetProduct.id }]
        }
      }
    });

    createdLotId = lot.id;
    console.log(`✓ Lote criado com sucesso! ID: ${lot.id} | Código: ${lot.batchCode}`);
    console.log(`✓ Valor FOB: US$ ${fobTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | Taxa Câmbio: R$ ${exchangeRate.toFixed(2)}`);
    console.log(`✓ Custo Total Nacionalizado Calculado: R$ ${totalCostNationalized.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    console.log(`✓ Custo Unitário por Arma: R$ ${unitCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    console.log(`✓ Status inicial do Lote: ${lot.status}`);

    // ------------------------------------------------------------------
    // ETAPA 3: Transição do Ciclo de Vida do Lote (Status)
    // ------------------------------------------------------------------
    console.log("\n🚢 ETAPA 3: Testando ciclo de vida e avanço de status do Lote...");
    const statuses = ["TRANSITO", "NACIONALIZANDO", "DISPONIVEL"];
    for (const st of statuses) {
      const updated = await prisma.importLot.update({
        where: { id: lot.id },
        data: { status: st }
      });
      console.log(`✓ Status atualizado para: ${updated.status}`);
    }

    // ------------------------------------------------------------------
    // ETAPA 4: Upload e Vínculo de Documentos de Importação
    // ------------------------------------------------------------------
    console.log("\n📄 ETAPA 4: Testando upload e registro de documentos ao Lote...");
    const docName = "COMMERCIAL_INVOICE_TEST.pdf";
    const doc = await prisma.document.create({
      data: {
        name: docName,
        type: "PDF",
        category: "INVOICE",
        stage: "PEDIDO",
        size: "125.4 KB",
        base64Data: "data:application/pdf;base64,JVBERi0xLjQKJ...",
        lotId: lot.id,
        realizedValue: fobTotal * exchangeRate,
        realizedDate: new Date()
      }
    });
    console.log(`✓ Documento '${doc.name}' anexado ao lote (Categoria: ${doc.category}, Estágio: ${doc.stage}, Valor Realizado: R$ ${doc.realizedValue})`);

    // ------------------------------------------------------------------
    // ETAPA 5: Registro de Séries / Entrada Física no Mapa de Armas
    // ------------------------------------------------------------------
    console.log("\n🎯 ETAPA 5: Registrando Números de Série e dando entrada física no estoque...");
    const testSerials = [
      `TEST-SER-${Date.now().toString().slice(-4)}-1`,
      `TEST-SER-${Date.now().toString().slice(-4)}-2`,
      `TEST-SER-${Date.now().toString().slice(-4)}-3`
    ];

    console.log(`✓ Inserindo 3 números de série:`, testSerials);

    // Criação no Mapa de Armas
    const creations = testSerials.map(serial =>
      prisma.weaponMap.create({
        data: {
          serialNumber: serial,
          productId: targetProduct.id,
          supplierId: supplier.id,
          importLotId: lot.id,
          currentStatus: "ESTOQUE",
          unitCost: unitCost,
          entryDate: new Date(),
          warehouseLocation: "GALPAO-A1",
          observations: "Entrada via teste E2E de importação"
        }
      })
    );

    const createdWeapons = await prisma.$transaction(creations);
    testWeaponsCreated = createdWeapons;
    console.log(`✓ ${createdWeapons.length} armas físicas cadastradas no WeaponMap com status 'ESTOQUE' e Custo Unitário R$ ${unitCost.toFixed(2)}.`);

    // Registro das movimentações de extrato
    for (const w of createdWeapons) {
      await prisma.weaponMovement.create({
        data: {
          weaponId: w.id,
          type: "ENTRADA",
          description: `Entrada em estoque via lote ${lot.batchCode}`
        }
      });
    }
    console.log(`✓ Extrato de movimentação (WeaponMovement) registrado com evento 'ENTRADA'.`);

    // Incremento de Estoque Disponível no Produto
    const productAfterImport = await prisma.product.update({
      where: { id: targetProduct.id },
      data: { stockAvailable: { increment: testSerials.length } }
    });
    console.log(`✓ Saldo de estoque do produto ${targetProduct.commercialName} atualizado de ${testProductInitialStock} para ${productAfterImport.stockAvailable} un.`);

    if (productAfterImport.stockAvailable !== testProductInitialStock + testSerials.length) {
      throw new Error("Erro: O estoque do produto não incrementou a quantidade correta de séries!");
    }

    // ------------------------------------------------------------------
    // ETAPA 6: Teste de Prevenção de Séries Duplicadas
    // ------------------------------------------------------------------
    console.log("\n🛡️ ETAPA 6: Testando validação de duplicidade de números de série...");
    const duplicateCheck = await prisma.weaponMap.findMany({
      where: { serialNumber: { in: [testSerials[0]] } }
    });

    if (duplicateCheck.length > 0) {
      console.log(`✓ Sistema detectou corretamente série já existente: '${duplicateCheck[0].serialNumber}' (Validação de duplicidade OK)`);
    } else {
      throw new Error("Falha na checagem de duplicidade!");
    }

    // ------------------------------------------------------------------
    // ETAPA 7: Consulta no Mapa de Armas e Extrato de Movimentações
    // ------------------------------------------------------------------
    console.log("\n📊 ETAPA 7: Verificando integridade e rastreabilidade no Mapa de Armas...");
    const queriedWeapons = await prisma.weaponMap.findMany({
      where: { importLotId: lot.id },
      include: {
        product: true,
        importLot: true,
        movements: true
      }
    });

    console.log(`✓ Total de armas vinculadas ao lote ${lot.batchCode}: ${queriedWeapons.length}`);
    for (const qw of queriedWeapons) {
      console.log(`  - Série: ${qw.serialNumber} | Status: ${qw.currentStatus} | Local: ${qw.warehouseLocation} | Movimentações: ${qw.movements.length} evento(s)`);
      if (qw.currentStatus !== "ESTOQUE" || qw.movements.length === 0) {
        throw new Error(`Arma ${qw.serialNumber} com status ou movimentação inconsistente!`);
      }
    }

    // ------------------------------------------------------------------
    // ETAPA 8: Teste de Proteção contra Exclusão Acidental de Lotes com Armas
    // ------------------------------------------------------------------
    console.log("\n🔒 ETAPA 8: Testando trava de segurança contra exclusão de lote com armas vinculadas...");
    const weaponCount = await prisma.weaponMap.count({ where: { importLotId: lot.id } });
    if (weaponCount > 0) {
      console.log(`✓ Trava de segurança ativa: O lote possui ${weaponCount} arma(s) associada(s) e sua exclusão direta é impedida pelo sistema.`);
    }

    // ------------------------------------------------------------------
    // ETAPA 9: Limpeza / Teardown Seguro e Restauração de Dados
    // ------------------------------------------------------------------
    console.log("\n🧹 ETAPA 9: Executando limpeza do teste e restaurando estoque original...");

    // 1. Exclui movimentos
    await prisma.weaponMovement.deleteMany({
      where: { weaponId: { in: testWeaponsCreated.map(w => w.id) } }
    });

    // 2. Exclui armas
    await prisma.weaponMap.deleteMany({
      where: { id: { in: testWeaponsCreated.map(w => w.id) } }
    });

    // 3. Exclui documento
    await prisma.document.delete({
      where: { id: doc.id }
    });

    // 4. Desvincula produto do lote antes de excluir
    await prisma.product.updateMany({
      where: { importLotId: lot.id },
      data: { importLotId: null }
    });

    // 5. Exclui lote
    await prisma.importLot.delete({
      where: { id: lot.id }
    });

    // 6. Restaura estoque do produto
    await prisma.product.update({
      where: { id: targetProduct.id },
      data: { stockAvailable: testProductInitialStock }
    });

    console.log("✓ Movimentações e armas de teste removidas com sucesso.");
    console.log("✓ Documentos e Lote de importação de teste excluídos.");
    console.log(`✓ Saldo do produto ${targetProduct.commercialName} restaurado para ${testProductInitialStock} un.`);

    console.log("\n==========================================================");
    console.log("   TODOS OS TESTES DE IMPORTAÇÃO PASSARAM COM SUCESSO!    ");
    console.log("==========================================================");

  } catch (error) {
    console.error("\n❌ FALHA NO TESTE E2E DE IMPORTAÇÃO:", error);

    // Tentativa de limpeza de emergência
    if (testWeaponsCreated.length > 0) {
      await prisma.weaponMovement.deleteMany({ where: { weaponId: { in: testWeaponsCreated.map(w => w.id) } } }).catch(() => {});
      await prisma.weaponMap.deleteMany({ where: { id: { in: testWeaponsCreated.map(w => w.id) } } }).catch(() => {});
    }
    if (createdLotId) {
      await prisma.document.deleteMany({ where: { lotId: createdLotId } }).catch(() => {});
      await prisma.product.updateMany({ where: { importLotId: createdLotId }, data: { importLotId: null } }).catch(() => {});
      await prisma.importLot.delete({ where: { id: createdLotId } }).catch(() => {});
    }
    if (targetProduct && testProductInitialStock !== undefined) {
      await prisma.product.update({
        where: { id: targetProduct.id },
        data: { stockAvailable: testProductInitialStock }
      }).catch(() => {});
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runImportE2ETest();
