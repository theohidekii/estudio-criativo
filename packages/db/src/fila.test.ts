import assert from "node:assert/strict";
import { test } from "node:test";
import { abrirBanco } from "./index";
import { migrarBanco } from "./migrar";
import { concluir, enfileirar, falhar, pegarProxima } from "./fila";

test("fila: enfileira, pega, falha com retentativa e conclui", () => {
  const db = migrarBanco(abrirBanco(":memory:"));
  const t = enfileirar(db, "render", { video: 1 });
  const p = pegarProxima(db);
  assert.equal(p?.id, t.id);
  assert.equal(pegarProxima(db), null);
  falhar(db, t.id, "erro");
  assert.equal(pegarProxima(db)?.tentativas, 2);
  concluir(db, t.id);
  assert.equal(pegarProxima(db), null);
});

test("fila: depois de 3 tentativas fica como falhou", () => {
  const db = migrarBanco(abrirBanco(":memory:"));
  const t = enfileirar(db, "x");
  for (let i = 0; i < 3; i++) { pegarProxima(db); falhar(db, t.id, "e"); }
  assert.equal(pegarProxima(db), null);
});
