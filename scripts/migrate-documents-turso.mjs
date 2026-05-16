import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis do arquivo .env manualmente
try {
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      if (line.trim().startsWith("#") || !line.includes("=")) return;
      const parts = line.split("=");
      const key = parts[0].trim();
      let value = parts.slice(1).join("=").trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[key] = value;
    });
  }
} catch (e) {}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Erro: TURSO_DATABASE_URL ou TURSO_AUTH_TOKEN não encontrados nas variáveis do .env");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function run() {
  console.log("=== INICIANDO MIGRAÇÃO DE ALTERAÇÃO DE TABELA NO TURSO ===");
  console.log(`Conectando em: ${url}`);

  try {
    // Adicionando a coluna user_id na tabela documents
    console.log("Executando: ALTER TABLE \"documents\" ADD COLUMN \"user_id\" TEXT;");
    await client.execute('ALTER TABLE "documents" ADD COLUMN "user_id" TEXT;');
    console.log("✅ Coluna 'user_id' adicionada com sucesso à tabela 'documents' no Turso!");
  } catch (error) {
    if (error.message.includes("duplicate column name")) {
      console.log("ℹ️ A coluna 'user_id' já existe na tabela 'documents'.");
    } else {
      console.error("❌ Erro ao tentar adicionar coluna:", error.message);
    }
  }

  process.exit(0);
}

run();
