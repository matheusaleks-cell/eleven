const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Hash passwords
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const investorPassword = await bcrypt.hash('Invest@123', 12);
  const commercialPassword = await bcrypt.hash('Carlos@123', 12);

  // Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@elevenfirearms.com.br' },
    update: {},
    create: {
      name: 'Admin Eleven',
      email: 'admin@elevenfirearms.com.br',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const francisco = await prisma.user.upsert({
    where: { email: 'francisco@email.com' },
    update: {},
    create: {
      name: 'Francisco Investidor',
      email: 'francisco@email.com',
      password: investorPassword,
      role: 'INVESTOR',
    },
  });

  const carlos = await prisma.user.upsert({
    where: { email: 'carlos@elevenfirearms.com.br' },
    update: {},
    create: {
      name: 'Carlos Santos',
      email: 'carlos@elevenfirearms.com.br',
      password: commercialPassword,
      role: 'COMMERCIAL',
    },
  });

  // Supplier
  const turkArms = await prisma.supplier.create({
    data: {
      name: 'Turk Arms',
      country: 'Turquia',
      contactEmail: 'supplier@turkarms.com',
      status: 'ACTIVE',
    },
  });

  // Product
  const vr12p = await prisma.product.create({
    data: {
      sku: 'VEZIR-VR12P',
      commercialName: 'Vezir Arms Carrera VR-12P',
      brand: 'Vezir Arms',
      model: 'VR-12P',
      caliber: '12 gauge',
      species: 'Espingarda',
      actionType: 'Semi-automática',
      capacity: 5,
      barrelLength: 51,
      finish: 'Matte Black',
      originCountry: 'Turquia',
      ncm: '9303.20.00',
      priceB2C: 8500,
      priceB2B: 6500,
      status: 'ACTIVE',
    },
  });

  // Project
  const project = await prisma.investmentProject.create({
    data: {
      name: 'VR-12P · Francisco · Lote 01',
      productName: 'Vezir Arms VR-12P',
      investorId: francisco.id,
      createdById: admin.id,
      initialCapital: 63000,
      maxCycles: 8,
      profitSplitPct: 0.50,
      status: 'ACTIVE',
    },
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
