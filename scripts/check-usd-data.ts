import { prisma } from "@/lib/prisma";

async function main() {
  const lot = await prisma.importLot.findFirst({
    where: { currency: "USD" },
    orderBy: { createdAt: "desc" }
  });
  console.log("Último lote USD:", lot);
}

main().catch(console.error);
