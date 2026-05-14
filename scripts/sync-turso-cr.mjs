import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

async function main() {
  const migrations = [
    "ALTER TABLE leads ADD COLUMN cr_number TEXT;",
    "ALTER TABLE leads ADD COLUMN cr_validity TEXT;"
  ];

  for (const sql of migrations) {
    try {
      await client.execute(sql);
      console.log(`[OK] ${sql}`);
    } catch (e) {
      console.log(`[PULAR] ${sql} - ${e.message}`);
    }
  }
}

main().catch(console.error);
