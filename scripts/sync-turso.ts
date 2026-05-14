
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Erro: TURSO_DATABASE_URL ou TURSO_AUTH_TOKEN não encontrados no .env");
  process.exit(1);
}

const client = createClient({ url, authToken });

const migrations = [
  "ALTER TABLE customers ADD COLUMN address_number TEXT",
  "ALTER TABLE customers ADD COLUMN address_complement TEXT",
  "ALTER TABLE customers ADD COLUMN neighborhood TEXT",
  "ALTER TABLE customers ADD COLUMN cep TEXT",
  "ALTER TABLE customers ADD COLUMN fantasy_name TEXT",
  "ALTER TABLE customers ADD COLUMN state_registration TEXT",
  "ALTER TABLE customers ADD COLUMN responsible_name TEXT",
  "ALTER TABLE customers ADD COLUMN store_email TEXT",
  "ALTER TABLE customers ADD COLUMN seller_id TEXT"
];

async function main() {
  console.log("Iniciando migração manual para o Turso...");

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
