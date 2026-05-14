import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Erro: TURSO_DATABASE_URL ou TURSO_AUTH_TOKEN não encontrados nas variáveis de ambiente.");
  process.exit(1);
}

const client = createClient({ url, authToken });

const migrations = [
  "ALTER TABLE leads ADD COLUMN is_archived BOOLEAN DEFAULT 0;"
];

async function main() {
  console.log("Iniciando migração de is_archived no Turso...");

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
