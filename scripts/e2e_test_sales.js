import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

async function runEndToEndTest() {
  console.log("=================================================");
  console.log("   TESTE DE FLUXO DE PONTA A PONTA (E2E) - VENDA ");
  console.log("=================================================\n");

  // ETAPA 1: Busca de Produto e Validação de Estoque Inicial
  console.log("📦 ETAPA 1: Consultando catálogo e produto VR 12...");
  const vr12 = await prisma.product.findFirst({
    where: { commercialName: { contains: "VR 12" } },
    include: {
      weapons: {
        where: { currentStatus: "ESTOQUE" },
        orderBy: { serialNumber: "asc" }
      }
    }
  });

  if (!vr12) {
    throw new Error("Produto VR 12 não encontrado!");
  }

  const initialStock = vr12.stockAvailable;
  const initialWeaponsCount = vr12.weapons.length;
  console.log(`✓ Produto: ${vr12.commercialName}`);
  console.log(`✓ Estoque registrado no produto: ${initialStock} un.`);
  console.log(`✓ Armas físicas ativas no WeaponMap: ${initialWeaponsCount} un.`);
  console.log(`✓ Primeiras 3 séries disponíveis:`, vr12.weapons.slice(0, 3).map(w => w.serialNumber));

  if (initialStock <= 0 || initialWeaponsCount <= 0) {
    throw new Error("Estoque inicial zerado ou sem séries!");
  }

  // ETAPA 2: Seleção de Cliente e Vendedor
  console.log("\n👤 ETAPA 2: Selecionando cliente e vendedor para a venda...");
  const customer = await prisma.customer.findFirst({
    where: { name: { contains: "SUBMIL" } }
  }) || await prisma.customer.findFirst();

  if (!customer) {
    throw new Error("Nenhum cliente encontrado no sistema!");
  }
  console.log(`✓ Cliente selecionado: ${customer.name} (${customer.type || "B2B"})`);

  const seller = await prisma.user.findFirst({
    where: { role: "ADMIN" }
  }) || await prisma.user.findFirst();

  if (!seller) {
    throw new Error("Nenhum vendedor/usuário encontrado no sistema!");
  }
  console.log(`✓ Vendedor responsável: ${seller.name} (${seller.email})`);

  // ETAPA 3: Simulação de Pedido de Venda com 2 unidades e 2 Séries Específicas
  const testSerials = [vr12.weapons[0].serialNumber, vr12.weapons[1].serialNumber];
  const testQty = 2;
  const unitPrice = vr12.priceB2C || 5000;
  const discount = 200;
  const totalBruto = unitPrice * testQty;
  const totalLiquido = totalBruto - discount;

  console.log("\n🛒 ETAPA 3: Montando carrinho e selecionando números de série...");
  console.log(`✓ Quantidade: ${testQty} un.`);
  console.log(`✓ Séries escolhidas:`, testSerials);
  console.log(`✓ Valor Unitário: R$ ${unitPrice.toFixed(2)} | Subtotal: R$ ${totalBruto.toFixed(2)} | Desconto: R$ ${discount.toFixed(2)} | Total Líquido: R$ ${totalLiquido.toFixed(2)}`);

  // ETAPA 4: Executando a Venda (Criação de SalesOrder e Baixa de Estoque)
  console.log("\n💾 ETAPA 4: Processando e gravando a venda no banco de dados...");
  
  const orderNumber = `TEST-${Date.now().toString().slice(-6)}`;
  const order = await prisma.salesOrder.create({
    data: {
      orderNumber,
      customerId: customer.id,
      sellerId: seller.id,
      totalValue: totalLiquido,
      status: "PAGO",
      paymentMethod: "PIX",
      products: JSON.stringify([{
        id: vr12.id,
        name: vr12.commercialName,
        sku: vr12.sku,
        price: unitPrice,
        quantity: testQty,
        serialNumbers: testSerials,
        lotPreference: "AUTO"
      }]),
      notes: `[TESTE E2E AUTOMATIZADO - Desconto R$ ${discount.toFixed(2)}]`,
      proposedDate: new Date(),
    }
  });

  console.log(`✓ Pedido de Venda criado com sucesso! ID: ${order.id} | Código: ${order.orderNumber}`);

  // Baixa de estoque no produto
  await prisma.product.update({
    where: { id: vr12.id },
    data: { stockAvailable: Math.max(0, initialStock - testQty) }
  });

  // Localiza armas físicas pelas séries
  const weaponsToSell = await prisma.weaponMap.findMany({
    where: {
      productId: vr12.id,
      serialNumber: { in: testSerials }
    }
  });

  // Atualização dos números de série no WeaponMap
  await Promise.all(
    weaponsToSell.map(w =>
      prisma.weaponMap.update({
        where: { id: w.id },
        data: {
          currentStatus: "VENDIDO",
          salesOrderId: order.id,
          customerId: customer.id,
          sellingUserId: seller.id,
          saleDate: new Date(),
          saleValue: (totalLiquido / testQty)
        }
      })
    )
  );

  console.log(`✓ ${weaponsToSell.length} armas físicas vinculadas e atualizadas para status 'VENDIDO'.`);

  // ETAPA 5: Verificação Pós-Venda
  console.log("\n🔍 ETAPA 5: Verificando consistência pós-venda...");

  // 1. Produto atualizado
  const updatedProduct = await prisma.product.findUnique({
    where: { id: vr12.id },
    select: { stockAvailable: true }
  });
  console.log(`✓ Novo saldo de estoque do produto: ${updatedProduct?.stockAvailable} un. (Esperado: ${initialStock - testQty})`);

  if (updatedProduct?.stockAvailable !== initialStock - testQty) {
    throw new Error("Erro: O saldo do produto não decrementou corretamente!");
  }

  // 2. Armas vendidas
  const soldWeapons = await prisma.weaponMap.findMany({
    where: {
      productId: vr12.id,
      serialNumber: { in: testSerials }
    }
  });

  for (const w of soldWeapons) {
    console.log(`✓ Arma Série ${w.serialNumber}: Status = ${w.currentStatus}, Pedido = ${w.salesOrderId}, Cliente = ${w.customerId}, Valor = R$ ${w.saleValue}`);
    if (w.currentStatus !== "VENDIDO" || w.salesOrderId !== order.id) {
      throw new Error(`Arma ${w.serialNumber} não está com status ou pedido correto!`);
    }
  }

  // 3. Armas restantes em estoque
  const remainingInStock = await prisma.weaponMap.count({
    where: {
      productId: vr12.id,
      currentStatus: "ESTOQUE"
    }
  });
  console.log(`✓ Armas restantes disponíveis no estoque: ${remainingInStock} un. (Esperado: ${initialWeaponsCount - testQty})`);

  // ETAPA 6: Rollback / Limpeza do teste para manter o banco limpo
  console.log("\n🧹 ETAPA 6: Limpando registro de teste e restaurando estoque original...");

  // Restaura armas para ESTOQUE
  await Promise.all(
    soldWeapons.map(w =>
      prisma.weaponMap.update({
        where: { id: w.id },
        data: {
          currentStatus: "ESTOQUE",
          salesOrderId: null,
          customerId: null,
          sellingUserId: null,
          saleDate: null,
          saleValue: null
        }
      })
    )
  );

  // Restaura saldo do produto
  await prisma.product.update({
    where: { id: vr12.id },
    data: { stockAvailable: initialStock }
  });

  // Exclui pedido de teste
  await prisma.salesOrder.delete({
    where: { id: order.id }
  });

  console.log("✓ Armas restauradas para status 'ESTOQUE'.");
  console.log(`✓ Saldo do produto VR 12 restaurado para ${initialStock} un.`);
  console.log("✓ Pedido temporário de teste excluído com sucesso.");

  console.log("\n=================================================");
  console.log("       TODOS OS TESTES PASSARAM COM SUCESSO!     ");
  console.log("=================================================");
}

runEndToEndTest()
  .catch((err) => {
    console.error("\n❌ FALHA NO TESTE E2E:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
