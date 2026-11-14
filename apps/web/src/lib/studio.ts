import { spawn } from "node:child_process";
import { connect } from "node:net";
import { openSync } from "node:fs";
import path from "node:path";

export const PORTA_STUDIO = 3030;
export const URL_STUDIO = `http://localhost:${PORTA_STUDIO}`;

const RAIZ = path.resolve(process.cwd(), "../..");
const PACOTE_VIDEO = path.join(RAIZ, "packages", "video");
const CLI_REMOTION = path.join(RAIZ, "node_modules", "@remotion", "cli", "remotion-cli.js");
const LOG_STUDIO = path.join(RAIZ, "storage", "studio.log");

/** Só verifica se a porta responde (rápido). Pedir a página inteira estourava o tempo: o Studio demora para responder. */
export function studioAtivo(): Promise<boolean> {
  return new Promise((resolve) => {
    const s = connect({ host: "127.0.0.1", port: PORTA_STUDIO });
    const fim = (ok: boolean) => { s.destroy(); resolve(ok); };
    s.setTimeout(800, () => fim(false));
    s.once("connect", () => fim(true));
    s.once("error", () => fim(false));
  });
}

/**
 * Sobe o Remotion Studio dentro do próprio projeto (packages/video), em segundo plano, sem precisar de terminal.
 * Chama o CLI direto pelo Node (sem npx), e a saída vai para storage/studio.log para diagnóstico.
 */
export async function iniciarStudio() {
  if (await studioAtivo()) return;
  const saida = openSync(LOG_STUDIO, "a");
  const p = spawn(process.execPath, [CLI_REMOTION, "studio", `--port=${PORTA_STUDIO}`, "--no-open"], {
    cwd: PACOTE_VIDEO, detached: true, stdio: ["ignore", saida, saida], windowsHide: true,
  });
  p.unref();
}
