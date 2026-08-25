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
  const weapon = await prisma.weaponMap.findFirst({
    where: { currentStatus: "ESTOQUE" }
  });
  const customer = await prisma.customer.findFirst();

  // Test single update with customer
  const updated = await prisma.weaponMap.update({
    where: { id: weapon.id },
    data: {
      customerId: customer.id,
      saleValue: 5000,
      saleDate: new Date(),
    }
  });
  console.log("Customer update OK:", updated.customerId);

  // Restore
  await prisma.weaponMap.update({
    where: { id: weapon.id },
    data: {
      customerId: null,
      saleValue: null,
      saleDate: null,
    }
  });
  console.log("Restored OK!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
