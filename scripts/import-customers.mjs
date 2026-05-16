import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const filePath = "c:\\Users\\User\\Documents\\SITES\\PROJETOS RAUL\\DASHBOARD INVESTIDORES\\comercios_raul_fiuza.txt";
  console.log(`Lendo arquivo: ${filePath}`);

  const content = fs.readFileSync(filePath, "utf-8");
  const entries = content.split(/\[\d+\/\d+\] ───────────────────────────────────────────────────────/);

  // O primeiro elemento do split costuma ser o cabeçalho, então ignoramos
  const clientEntries = entries.slice(1);
  console.log(`Total de entradas encontradas para processamento: ${clientEntries.length}`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < clientEntries.length; i++) {
    const entry = clientEntries[i];
    
    try {
      const nameMatch = entry.match(/RAZÃO SOCIAL\s*:\s*(.*)/);
      const cnpjMatch = entry.match(/CNPJ\s*:\s*(.*)/);
      const crMatch = entry.match(/TR\/CR\s*:\s*(.*)/);
      const statusMatch = entry.match(/STATUS CR\s*:\s*(.*)/);
      const addressMatch = entry.match(/ENDEREÇO\s*:\s*(.*)/);
      const neighborhoodMatch = entry.match(/BAIRRO\s*:\s*(.*)/);
      const cepMatch = entry.match(/CEP\s*:\s*(.*)/);
      const cityUfMatch = entry.match(/CIDADE\/UF\s*:\s*(.*)\s*\/\s*(.*)/);
      const productsMatch = entry.match(/PRODUTOS\s*\(\d+\)\s*:\s*([\s\S]*?)(?=\n\s*\w+\s*:|$)/);

      if (!nameMatch || !cnpjMatch) continue;

      const name = nameMatch[1].trim();
      const cnpj = cnpjMatch[1].trim();
      const crNumber = crMatch ? crMatch[1].trim() : null;
      const status = statusMatch ? (statusMatch[1].trim() === "AT" ? "ACTIVE" : "INACTIVE") : "ACTIVE";
      const address = addressMatch ? addressMatch[1].trim() : null;
      const neighborhood = neighborhoodMatch ? neighborhoodMatch[1].trim() : null;
      const cep = cepMatch ? cepMatch[1].trim() : null;
      const city = cityUfMatch ? cityUfMatch[1].trim() : null;
      const state = cityUfMatch ? cityUfMatch[2].trim() : "SP"; // Default
      const notes = productsMatch ? productsMatch[1].trim() : "";

      await prisma.customer.upsert({
        where: { cpfCnpj: cnpj },
        update: {
          name,
          status,
          address,
          neighborhood,
          cep,
          city,
          state,
          crNumber,
          notes: notes.substring(0, 1000) // Limitar notas
        },
        create: {
          name,
          cpfCnpj: cnpj,
          status,
          address,
          neighborhood,
          cep,
          city,
          state,
          crNumber,
          notes: notes.substring(0, 1000),
          type: "B2B",
          phone: "(00) 00000-0000" // Valor padrão para campo obrigatório
        }
      });

      successCount++;
      if (successCount % 100 === 0) {
        console.log(`Progresso: ${successCount} clientes processados...`);
      }
    } catch (error) {
      console.error(`Erro ao processar entrada ${i}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\nImportação concluída!`);
  console.log(`Sucesso: ${successCount}`);
  console.log(`Erros: ${errorCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
