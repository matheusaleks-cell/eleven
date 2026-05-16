/**
 * Import script: parses comercios_raul_fiuza.txt and bulk-inserts 6811 B2B customers.
 * Run with: npx ts-node --project tsconfig.json prisma/import-customers.ts
 */

import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ParsedCustomer {
  name: string;
  cnpj: string;
  crNumber: string | null;
  address: string | null;
  neighborhood: string | null;
  cep: string | null;
  city: string | null;
  state: string | null;
}

function parseFile(filePath: string): ParsedCustomer[] {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  const customers: ParsedCustomer[] = [];
  let current: Partial<ParsedCustomer> = {};
  let inRecord = false;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Start of a new record
    if (/^\[(\d+)\/\d+\]/.test(line)) {
      if (inRecord && current.cnpj) {
        customers.push(current as ParsedCustomer);
      }
      current = {};
      inRecord = true;
      continue;
    }

    if (!inRecord) continue;

    const extract = (prefix: string) => {
      if (line.includes(prefix)) {
        return line.split(prefix)[1]?.trim() || null;
      }
      return undefined;
    };

    const name = extract("RAZÃO SOCIAL :");
    if (name !== undefined) { current.name = name ?? ""; continue; }

    const cnpj = extract("CNPJ         :");
    if (cnpj !== undefined) { current.cnpj = cnpj ?? ""; continue; }

    const cr = extract("TR/CR        :");
    if (cr !== undefined) { current.crNumber = cr; continue; }

    const addr = extract("ENDEREÇO     :");
    if (addr !== undefined) { current.address = addr; continue; }

    const bairro = extract("BAIRRO       :");
    if (bairro !== undefined) { current.neighborhood = bairro; continue; }

    const cep = extract("CEP          :");
    if (cep !== undefined) { current.cep = cep; continue; }

    const cidadeUf = extract("CIDADE/UF    :");
    if (cidadeUf !== undefined) {
      const parts = cidadeUf ? cidadeUf.split("/") : [];
      current.city = parts[0]?.trim() || null;
      current.state = parts[1]?.trim().toUpperCase() || null;
      continue;
    }
  }

  // Push the last record
  if (inRecord && current.cnpj) {
    customers.push(current as ParsedCustomer);
  }

  return customers;
}

async function main() {
  const filePath = path.resolve(__dirname, "../../comercios_raul_fiuza.txt");

  if (!fs.existsSync(filePath)) {
    console.error(`Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }

  console.log("Lendo e parseando o arquivo...");
  const customers = parseFile(filePath);
  console.log(`Encontrados ${customers.length} estabelecimentos.`);

  if (customers.length === 0) {
    console.error("Nenhum registro foi parseado. Verifique o formato do arquivo.");
    process.exit(1);
  }

  const BATCH_SIZE = 200;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < customers.length; i += BATCH_SIZE) {
    const batch = customers.slice(i, i + BATCH_SIZE);

    const data = batch
      .filter((c) => c.cnpj && c.name)
      .map((c) => ({
        name: c.name.substring(0, 200),
        type: "B2B" as const,
        cpfCnpj: c.cnpj,
        phone: "(00) 00000-0000",
        state: c.state || "XX",
        city: c.city || null,
        address: c.address || null,
        neighborhood: c.neighborhood || null,
        cep: c.cep || null,
        crNumber: c.crNumber || null,
        category: "COMERCIO",
        source: "IMPORTACAO_SIGMA",
      }));

    for (const record of data) {
      try {
        await prisma.customer.upsert({
          where: { cpfCnpj: record.cpfCnpj },
          update: {},
          create: record,
        });
        inserted++;
      } catch {
        skipped++;
      }
    }

    const progress = Math.min(i + BATCH_SIZE, customers.length);
    process.stdout.write(`\rProgresso: ${progress}/${customers.length} (${inserted} inseridos, ${skipped} duplicados)`);
  }

  console.log(`\n\nImportação concluída!`);
  console.log(`  Inseridos: ${inserted}`);
  console.log(`  Duplicados ignorados: ${skipped}`);
}

main()
  .catch((e) => {
    console.error("Erro fatal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
