import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

// Carregar .env manualmente
try {
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      if (line.trim().startsWith("#") || !line.includes("=")) return;
      const parts = line.split("=");
      const key = parts[0].trim();
      let value = parts.slice(1).join("=").trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[key] = value;
    });
  }
} catch (e) {}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

let prisma: PrismaClient;

if (url && authToken) {
  const libsql = createClient({ url, authToken });
  const adapter = new PrismaLibSQL(libsql);
  prisma = new PrismaClient({ adapter });
} else {
  prisma = new PrismaClient();
}

async function test() {
  console.log("=== INICIANDO TESTE DE FILTRO NO TURSO ===");
  
  try {
    // 1. Teste de contagem total
    const total = await prisma.customer.count();
    console.log(`Total de clientes cadastrados no banco: ${total}`);

    // 2. Testar busca por termo geral (ex: "a")
    const search = "a";
    console.log(`\nTestando busca por termo '${search}'...`);
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: search } },
          { cpfCnpj: { contains: search } },
          { email: { contains: search } },
        ]
      },
      include: {
        salesOrders: true,
        documents: true,
      },
      take: 5
    });
    console.log(`Sucesso! Encontrados ${customers.length} registros para a busca '${search}'.`);
    
    // 3. Testar busca específica por CPF/CNPJ
    const documentSearch = "12";
    console.log(`\nTestando busca específica por documento contendo '${documentSearch}'...`);
    const docCustomers = await prisma.customer.findMany({
      where: {
        cpfCnpj: { contains: documentSearch }
      },
      take: 5
    });
    console.log(`Sucesso! Encontrados ${docCustomers.length} registros.`);
    
  } catch (error: any) {
    console.error("\n❌ ERRO DETECTADO NA CONSULTA DO BANCO DE DADOS:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
