import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Confere a conexão com o banco
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definida no arquivo .env");
}

// Configura o SQLite
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL,
});

// Cria o cliente do Prisma
const prisma = new PrismaClient({ adapter });

export default prisma;
