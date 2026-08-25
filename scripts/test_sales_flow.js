import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== VERIFICANDO FLUXO DE VENDAS E ESTOQUE ===");
  
  // 1. Localizar produto VR 12
  const vr12 = await prisma.product.findFirst({
    where: { commercialName: { contains: "VR 12" } },
    include: {
      weapons: {
        where: { currentStatus: "ESTOQUE" }
      }
    }
  });

  console.log("Produto:", vr12?.commercialName);
  console.log("Product.stockAvailable:", vr12?.stockAvailable);
  console.log("Armas em estoque no WeaponMap:", vr12?.weapons.length);
  console.log("Exemplos de Números de Série:", vr12?.weapons.slice(0, 5).map(w => w.serialNumber));

  if (vr12.stockAvailable === vr12.weapons.length && vr12.weapons.length > 0) {
    console.log(" Sincronização e contagem de estoque perfeitas!");
  } else {
    console.log(" Divergência encontrada!");
  }

  // 2. Verificar clientes
  const customer = await prisma.customer.findFirst();
  console.log("Cliente de teste:", customer?.name, "(ID:", customer?.id, ")");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
