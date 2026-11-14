import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { abrirBanco } from "./index";

const pasta = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "drizzle");
export function migrarBanco(db = abrirBanco()) {
  migrate(db, { migrationsFolder: pasta });
  return db;
}
if (process.argv[1] && process.argv[1].endsWith("migrar.ts")) {
  migrarBanco();
  console.log("Migrações aplicadas.");
}
