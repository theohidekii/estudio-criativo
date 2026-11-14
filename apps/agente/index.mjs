#!/usr/bin/env node
// Agente local: busca tarefas de IA no servidor e as executa com o Claude Code desta máquina
// (usa a assinatura de quem está logado no `claude`). Não guarda nem envia credenciais.
import { spawn } from "node:child_process";

const arg = (nome, padrao) => {
  const i = process.argv.indexOf(`--${nome}`);
  return i > -1 ? process.argv[i + 1] : (process.env[`AGENTE_${nome.toUpperCase()}`] ?? padrao);
};
const servidor = arg("servidor", "http://localhost:3000").replace(/\/$/, "");
const token = arg("token");
const comando = arg("comando", "claude"); // sobrescreva para testes
const intervalo = Number(arg("intervalo", "2000"));
const tempoMax = Number(arg("tempo-max", "300000"));

if (!token) {
  console.error("Uso: npm run agente -- --servidor http://localhost:3000 --token <token>");
  process.exit(1);
}

const modelos = { haiku: "haiku", sonnet: "sonnet" };

/** Roda `claude -p` sem ferramentas (só gera texto) e devolve a resposta. */
const FERRAMENTAS_OK = new Set(["WebSearch", "WebFetch"]); // só leitura da web; nunca arquivos nem comandos

function executarClaude(prompt, modelo, ferramentas = []) {
  return new Promise((resolve, reject) => {
    const ok = ferramentas.filter((f) => FERRAMENTAS_OK.has(f)).join(",");
    // No Windows o spawn usa shell (claude é um .cmd) e um argumento vazio se perderia: precisa de aspas literais.
    const vazio = process.platform === "win32" ? '""' : "";
    const args = comando === "claude"
      ? ["-p", "--model", modelos[modelo] ?? "haiku", "--tools", ok || vazio, ...(ok ? ["--allowedTools", ok] : [])]
      : [];
    const p = spawn(comando, args, { shell: process.platform === "win32", stdio: ["pipe", "pipe", "pipe"] });
    let out = "", err = "";
    const timer = setTimeout(() => { p.kill(); reject(new Error("tempo esgotado")); }, tempoMax);
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("error", (e) => { clearTimeout(timer); reject(new Error(`não consegui executar "${comando}": ${e.message}`)); });
    p.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0 && out.trim()) resolve(out.trim());
      else reject(new Error(err.trim() || `saiu com código ${code}`));
    });
    p.stdin.end(prompt);
  });
}

const chamar = (rota, corpo) =>
  fetch(`${servidor}/api/agente/${rota}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(corpo ?? {}),
  });

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
console.log(`Agente conectado a ${servidor}. Ctrl+C para sair.`);

for (;;) {
  try {
    const r = await chamar("pegar");
    if (r.status === 401) { console.error("Token inválido. Gere outro em /agentes."); process.exit(1); }
    if (r.status === 200) {
      const t = await r.json();
      console.log(`[tarefa ${t.id}] ${t.tipo}`);
      try {
        const resultado = await executarClaude(t.payload.prompt, t.payload.modelo, t.payload.ferramentas);
        await chamar("concluir", { id: t.id, resultado });
        console.log(`[tarefa ${t.id}] concluída`);
      } catch (e) {
        await chamar("concluir", { id: t.id, erro: String(e.message ?? e) });
        console.error(`[tarefa ${t.id}] erro: ${e.message}`);
      }
      continue;
    }
  } catch (e) {
    console.error(`Servidor indisponível (${e.cause?.code ?? e.message}). Tentando de novo…`);
  }
  await dormir(intervalo);
}
