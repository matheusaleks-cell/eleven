const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@libsql/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const libsql = createClient({ url, authToken });
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

async function run() {
  const products = await prisma.product.findMany();
  console.log('--- SYNCHRONIZING PRODUCT STOCK WITH WEAPON MAP ---');
  for (const p of products) {
    const activeWeaponsCount = await prisma.weaponMap.count({
      where: { productId: p.id, currentStatus: 'ESTOQUE' }
    });
    
    // If the product has weapons registered in WeaponMap, the stock must be at least the active weapon count
    const targetStock = activeWeaponsCount > 0 ? activeWeaponsCount : p.stockAvailable;
    
    if (p.stockAvailable !== targetStock) {
      console.log(`Updating "${p.commercialName}" (${p.sku}): stockAvailable was ${p.stockAvailable} -> now ${targetStock} (Weapons in ESTOQUE: ${activeWeaponsCount})`);
      await prisma.product.update({
        where: { id: p.id },
        data: { stockAvailable: targetStock }
      });
    } else {
      console.log(`Product "${p.commercialName}" (${p.sku}) is already in sync: ${p.stockAvailable} (Weapons in ESTOQUE: ${activeWeaponsCount})`);
    }
  }
  console.log('--- SYNC FINISHED ---');
}

run().catch(console.error).finally(() => process.exit(0));
