import { abrirBanco } from "@estudio/db";
import { migrarBanco } from "@estudio/db/src/migrar";

const g = globalThis as unknown as { __db?: ReturnType<typeof abrirBanco> };
export function db() {
  if (!g.__db) g.__db = migrarBanco(abrirBanco(process.env.DATABASE_PATH ?? "../../storage/estudio.db"));
  return g.__db;
}
