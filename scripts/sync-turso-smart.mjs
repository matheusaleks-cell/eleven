
import { createClient } from "@libsql/client";
import fs from "fs";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Erro: TURSO_DATABASE_URL ou TURSO_AUTH_TOKEN não encontrados nas variáveis de ambiente.");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function main() {
  console.log("Analisando full_schema_utf8.sql...");
  const sql = fs.readFileSync("full_schema_utf8.sql", "utf8");
  
  // Extrair tabelas e colunas
  const tables = {};
  const tableMatches = sql.matchAll(/CREATE TABLE\s+"?([^"\s]+)"?\s*\(([\s\S]*?)\);/g);
  
  for (const match of tableMatches) {
    const tableName = match[1];
    const columnsText = match[2];
    
    tables[tableName] = [];
    const lines = columnsText.split('\n');
    for (const line of lines) {
      const colMatch = line.trim().match(/^"([^"]+)"\s+([A-Z0-9]+)/i);
      if (colMatch) {
        tables[tableName].push({ name: colMatch[1], type: colMatch[2] });
      }
    }
  }

  console.log(`Encontradas ${Object.keys(tables).length} tabelas no schema local.`);
  
  for (const tableName of Object.keys(tables)) {
    try {
      const result = await client.execute(`PRAGMA table_info("${tableName}")`);
      const existingColumns = result.rows.map(r => r.name);
      
      if (existingColumns.length === 0) {
        console.log(`Tabela ${tableName} não existe. Você deve usar CREATE TABLE.`);
        continue;
      }

      const expectedColumns = tables[tableName];
      for (const col of expectedColumns) {
        if (!existingColumns.includes(col.name)) {
          const alterSql = `ALTER TABLE "${tableName}" ADD COLUMN "${col.name}" ${col.type}`;
          console.log(`[SYNC] Adicionando coluna: ${tableName}.${col.name}`);
          try {
            await client.execute(alterSql);
            console.log(`  -> Sucesso!`);
          } catch (e) {
            console.error(`  -> Erro: ${e.message}`);
          }
        }
      }
    } catch (e) {
      console.error(`Erro ao verificar tabela ${tableName}: ${e.message}`);
    }
  }

  console.log("Sincronização inteligente concluída!");
  process.exit(0);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
