import { spawn } from "node:child_process";
import path from "node:path";

export const PORTA_STUDIO = 3030;
export const URL_STUDIO = `http://localhost:${PORTA_STUDIO}`;

export async function studioAtivo(): Promise<boolean> {
  try {
    const r = await fetch(URL_STUDIO, { signal: AbortSignal.timeout(1500) });
    return r.ok;
  } catch {
    return false;
  }
}

/** Sobe o Remotion Studio (editor do Remotion) em segundo plano, se ainda não estiver rodando. */
export async function iniciarStudio() {
  if (await studioAtivo()) return;
  const cwd = path.resolve(process.cwd(), "../../packages/video");
  const p = spawn("npx", ["remotion", "studio", `--port=${PORTA_STUDIO}`, "--no-open"], {
    cwd, shell: process.platform === "win32", detached: true, stdio: "ignore", windowsHide: true,
  });
  p.unref();
}
