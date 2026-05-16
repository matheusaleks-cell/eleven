import { PrismaClient } from "@prisma/client";
import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import fs from "fs";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Erro: TURSO_DATABASE_URL ou TURSO_AUTH_TOKEN não encontrados no .env");
  process.exit(1);
}

const libsql = createClient({ url, authToken });
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

async function main() {
  const filePath = "c:\\Users\\User\\Documents\\SITES\\PROJETOS RAUL\\DASHBOARD INVESTIDORES\\comercios_raul_fiuza.txt";
  console.log(`[Turso] Lendo arquivo para sincronização: ${filePath}`);

  const content = fs.readFileSync(filePath, "utf-8");
  const entries = content.split(/\[\d+\/\d+\] ───────────────────────────────────────────────────────/);
  const clientEntries = entries.slice(1);
  
  console.log(`[Turso] Total de entradas: ${clientEntries.length}`);
  console.log(`[Turso] Conectado a: ${url}`);

  let successCount = 0;
  let errorCount = 0;

  // Processar em lotes menores para estabilidade no Turso
  const CHUNK_SIZE = 50; 
  for (let i = 0; i < clientEntries.length; i += CHUNK_SIZE) {
    const chunk = clientEntries.slice(i, i + CHUNK_SIZE);
    
    await Promise.all(chunk.map(async (entry) => {
      try {
        const nameMatch = entry.match(/RAZÃO SOCIAL\s*:\s*(.*)/);
        const cnpjMatch = entry.match(/CNPJ\s*:\s*(.*)/);
        const crMatch = entry.match(/TR\/CR\s*:\s*(.*)/);
        const statusMatch = entry.match(/STATUS CR\s*:\s*(.*)/);
        const addressMatch = entry.match(/ENDEREÇO\s*:\s*(.*)/);
        const neighborhoodMatch = entry.match(/BAIRRO\s*:\s*(.*)/);
        const cepMatch = entry.match(/CEP\s*:\s*(.*)/);
        const cityUfMatch = entry.match(/CIDADE\/UF\s*:\s*(.*)\s*\/\s*(.*)/);

        if (!nameMatch || !cnpjMatch) return;

        const cnpj = cnpjMatch[1].trim();
        const name = nameMatch[1].trim();
        const crNumber = crMatch ? crMatch[1].trim() : null;
        const status = statusMatch ? (statusMatch[1].trim() === "AT" ? "ACTIVE" : "INACTIVE") : "ACTIVE";
        const city = cityUfMatch ? cityUfMatch[1].trim() : null;
        const state = cityUfMatch ? cityUfMatch[2].trim() : "SP";

        await prisma.customer.upsert({
          where: { cpfCnpj: cnpj },
          update: {
            name,
            status,
            address: addressMatch ? addressMatch[1].trim() : null,
            neighborhood: neighborhoodMatch ? neighborhoodMatch[1].trim() : null,
            cep: cepMatch ? cepMatch[1].trim() : null,
            city,
            state,
            crNumber
          },
          create: {
            name,
            cpfCnpj: cnpj,
            status,
            address: addressMatch ? addressMatch[1].trim() : null,
            neighborhood: neighborhoodMatch ? neighborhoodMatch[1].trim() : null,
            cep: cepMatch ? cepMatch[1].trim() : null,
            city,
            state,
            crNumber,
            type: "B2B",
            phone: "(00) 00000-0000"
          }
        });
        successCount++;
      } catch (e) {
        errorCount++;
      }
    }));

    console.log(`[Turso] Progresso: ${Math.min(i + CHUNK_SIZE, clientEntries.length)} / ${clientEntries.length}...`);
  }

  console.log(`\n[Turso] Sincronização Concluída!`);
  console.log(`Sucesso: ${successCount}`);
  console.log(`Erros: ${errorCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
