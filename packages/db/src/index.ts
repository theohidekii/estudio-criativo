import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export * from "./schema";
export { schema };

export function abrirBanco(caminho = process.env.DATABASE_PATH ?? "estudio.db") {
  const sqlite = new Database(caminho);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}
export type Banco = ReturnType<typeof abrirBanco>;
