
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
  console.log("Iniciando criação de tabelas faltantes no Turso...");
  let sql = fs.readFileSync("full_schema.sql", "utf8");
  
  // Transformar os CREATE TABLE em CREATE TABLE IF NOT EXISTS para rodar com segurança
  sql = sql.replace(/CREATE TABLE "/g, 'CREATE TABLE IF NOT EXISTS "');
  sql = sql.replace(/CREATE UNIQUE INDEX "/g, 'CREATE UNIQUE INDEX IF NOT EXISTS "');

  // Separar em statements usando a string ';'
  const statements = sql.split(";").map(s => s.trim()).filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await client.execute(statement);
      console.log(`[OK] Executado: ${statement.substring(0, 60).replace(/\n/g, ' ')}...`);
    } catch (e) {
      if (e.message.includes("already exists")) {
        console.log(`[PULAR] Já existe: ${statement.substring(0, 60).replace(/\n/g, ' ')}...`);
      } else {
        console.error(`[ERRO] Falha: ${statement.substring(0, 60).replace(/\n/g, ' ')}...`);
        console.error(`Detalhe do erro: ${e.message}`);
      }
    }
  }

  console.log("Criação de tabelas e índices concluída!");
  process.exit(0);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
