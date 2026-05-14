import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

async function main() {
  const migrations = [
    `CREATE TABLE IF NOT EXISTS lead_logs (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      action TEXT NOT NULL,
      user TEXT DEFAULT 'Sistema',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE CASCADE
    );`
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
