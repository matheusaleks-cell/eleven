// Cria a tabela sales_goals no Turso (meta de faturamento mensal digitada pelo admin
// no mini-dashboard de Vendas). Não roda sozinho — o admin executa manualmente quando
// decidir aplicar em produção: npx tsx scripts/sync-turso-sales-goal.ts
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
  `CREATE TABLE IF NOT EXISTS "sales_goals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "target_value" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "sales_goals_month_year_key" ON "sales_goals"("month", "year")`,
];

async function main() {
  console.log("Criando tabela sales_goals no Turso...");

  for (const sql of migrations) {
    try {
      await client.execute(sql);
      console.log(`[OK] Executado: ${sql.split("\n")[0]}...`);
    } catch (error: any) {
      if (error.message.includes("already exists")) {
        console.log(`[PULAR] Já existe: ${sql.split("\n")[0]}...`);
      } else {
        console.error(`[ERRO] Falha: ${sql.split("\n")[0]}...`);
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
