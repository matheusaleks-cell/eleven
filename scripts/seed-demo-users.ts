import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

// Carregar variáveis do arquivo .env manualmente
try {
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      // Ignorar comentários e linhas vazias
      if (line.trim().startsWith("#") || !line.includes("=")) return;
      
      const parts = line.split("=");
      const key = parts[0].trim();
      let value = parts.slice(1).join("=").trim();
      
      // Remover aspas se existirem
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      
      process.env[key] = value;
    });
  }
} catch (e) {
  console.warn("Não foi possível carregar o arquivo .env manualmente:", e);
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

let prisma: PrismaClient;

if (url && authToken) {
  console.log("[Seed] Conectando com sucesso ao Turso:", url);
  const libsql = createClient({ url, authToken });
  const adapter = new PrismaLibSQL(libsql);
  prisma = new PrismaClient({ adapter });
} else {
  console.log("[Seed] Avisando: Usando SQLite local (dev.db)");
  prisma = new PrismaClient();
}

async function main() {
  console.log("Iniciando seed de usuários Demo...");
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Usuário Investidor (Demo)
  const investor = await prisma.user.upsert({
    where: { email: "francisco@email.com" },
    update: { password: hashedPassword, role: "INVESTOR" },
    create: {
      email: "francisco@email.com",
      name: "Francisco (Demo)",
      password: hashedPassword,
      role: "INVESTOR",
    },
  });
  console.log(`Usuário Investidor garantido: ${investor.email}`);

  // Usuário Admin (Demo - com .br)
  const adminBr = await prisma.user.upsert({
    where: { email: "admin@elevenfirearms.com.br" },
    update: { password: hashedPassword, role: "ADMIN" },
    create: {
      email: "admin@elevenfirearms.com.br",
      name: "Admin Master (Demo)",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log(`Usuário Admin (.com.br) garantido: ${adminBr.email}`);

  // Usuário Admin (Demo - backup .com)
  const adminCom = await prisma.user.upsert({
    where: { email: "admin@eleven.com" },
    update: { password: hashedPassword, role: "ADMIN" },
    create: {
      email: "admin@eleven.com",
      name: "Admin Demo",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log(`Usuário Admin (.com) garantido: ${adminCom.email}`);

  console.log("Concluído com sucesso no banco de dados!");
}

main()
  .catch((e) => {
    console.error("Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
