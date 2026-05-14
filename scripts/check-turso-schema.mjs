import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

async function main() {
  const res = await client.execute("PRAGMA table_info(leads);");
  console.log("Colunas da tabela leads:");
  console.table(res.rows.map(r => ({ name: r.name, type: r.type })));

  const resLogs = await client.execute("PRAGMA table_info(lead_logs);");
  console.log("\nColunas da tabela lead_logs:");
  console.table(resLogs.rows.map(r => ({ name: r.name, type: r.type })));
}

main().catch(console.error);
