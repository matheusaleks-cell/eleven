
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Erro: TURSO_DATABASE_URL ou TURSO_AUTH_TOKEN não encontrados nas variáveis de ambiente.");
  process.exit(1);
}

const client = createClient({ url, authToken });

const migrations = [
  "ALTER TABLE customers ADD COLUMN cr_number TEXT",
  "ALTER TABLE customers ADD COLUMN category TEXT",
  "ALTER TABLE customers ADD COLUMN rg TEXT",
  "ALTER TABLE customers ADD COLUMN birth_date DATETIME",
  "ALTER TABLE customers ADD COLUMN cr_validity_date DATETIME",
  "ALTER TABLE customers ADD COLUMN source TEXT",
  "ALTER TABLE customers ADD COLUMN notes TEXT"
];

async function main() {
  console.log("Iniciando migração manual parte 2 para o Turso usando variáveis nativas...");

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

  console.log("Migração parte 2 concluída!");
  process.exit(0);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
