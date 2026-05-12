import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = [
    {
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
      priceB2C: 11500,
      priceB2B: 8900,
      stockAvailable: 15,
      technicalDescription: "Cano rosqueado, gatilho de alumínio flat-face, funil de carregador Salient Arms.",
      status: "ACTIVE"
    },
    {
      sku: "CANIK-METE-SFT",
      commercialName: "Canik Mete SFT",
      brand: "Canik",
      model: "Mete SFT",
      caliber: "9mm",
      species: "Pistola",
      actionType: "Semiautomática",
      capacity: 20,
      barrelLength: 4.46,
      finish: "Preto/FDE",
      originCountry: "Turquia",
      ncm: "9302.00.00",
      priceB2C: 9800,
      priceB2B: 7500,
      stockAvailable: 25,
      technicalDescription: "Preparada para optics, novos grips texturizados, desmontagem simplificada.",
      status: "ACTIVE"
    },
    {
      sku: "VEZIR-B100",
      commercialName: "Vezir Arms B100 Bullpup",
      brand: "Vezir Arms",
      model: "B100",
      caliber: "12 Gauge",
      species: "Espingarda",
      actionType: "Semiautomática",
      capacity: 5,
      barrelLength: 20,
      finish: "Oxidado",
      originCountry: "Turquia",
      ncm: "9303.20.00",
      priceB2C: 7900,
      priceB2B: 5800,
      stockAvailable: 10,
      technicalDescription: "Design Bullpup compacto, trilhos picatinny, ideal para defesa residencial.",
      status: "ACTIVE"
    },
    {
      sku: "DERYA-TM22",
      commercialName: "Derya TM-22 Aluminum",
      brand: "Derya Arms",
      model: "TM-22",
      caliber: ".22 LR",
      species: "Rifle",
      actionType: "Semiautomática",
      capacity: 10,
      barrelLength: 18,
      finish: "Anodizado",
      originCountry: "Turquia",
      ncm: "9303.30.00",
      priceB2C: 5500,
      priceB2B: 4200,
      stockAvailable: 30,
      technicalDescription: "Chassi totalmente em alumínio, compatível com acessórios AR-15.",
      status: "ACTIVE"
    },
    {
      sku: "GIRSAN-MC28",
      commercialName: "Girsan MC28 SA",
      brand: "Girsan",
      model: "MC28 SA",
      caliber: "9mm",
      species: "Pistola",
      actionType: "Semiautomática",
      capacity: 15,
      barrelLength: 4.25,
      finish: "Preto Fosco",
      originCountry: "Turquia",
      ncm: "9302.00.00",
      priceB2C: 6200,
      priceB2B: 4800,
      stockAvailable: 20,
      technicalDescription: "Excelente custo-benefício, trilho para acessórios, backstraps intercambiáveis.",
      status: "ACTIVE"
    }
  ];

  console.log('Iniciando o cadastro de armas de elite...');

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: p,
      create: p,
    });
    console.log(`✅ ${p.commercialName} cadastrada/atualizada.`);
  }

  console.log('Catálogo Eleven Firearms atualizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
