import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Erro: TURSO_DATABASE_URL ou TURSO_AUTH_TOKEN não encontrados nas variáveis de ambiente.");
  process.exit(1);
}

const client = createClient({ url, authToken });

const migrations = [
  "ALTER TABLE leads ADD COLUMN tax_id TEXT;",
  "ALTER TABLE leads ADD COLUMN state TEXT;",
  "ALTER TABLE leads ADD COLUMN city TEXT;",
  "ALTER TABLE leads ADD COLUMN customer_type TEXT;",
  "ALTER TABLE leads ADD COLUMN document_status TEXT;",
  "ALTER TABLE leads ADD COLUMN category TEXT;"
];

async function main() {
  console.log("Iniciando migração de novos campos no Lead para o Turso...");

  for (const sql of migrations) {
    try {
      await client.execute(sql);
      console.log(`[OK] Executado: ${sql}`);
    } catch (error) {
      if (error.message.includes("duplicate column name") || error.message.includes("already exists")) {
        console.log(`[PULAR] Já existe: ${sql}`);
      } else {
        console.error(`[ERRO] Falha: ${sql}`);
        console.error(error.message);
      }
    }
  }

  console.log("Migração concluída!");
  process.exit(0);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
