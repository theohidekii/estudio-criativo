import { execFile } from "node:child_process";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { narrarComTempos, type Palavra } from "./elevenlabs";

const exec = promisify(execFile);
const raiz = path.resolve(process.cwd(), "../..");
export const pastaVideo = (videoId: number, n: number) => path.join(raiz, "storage", "videos", String(videoId), `v${n}`);

/** Tira a numeração ("1. ") e linhas vazias do roteiro, deixando uma frase por linha. */
export const limparRoteiro = (t: string) =>
  t.split(/\r?\n/).map((l) => l.replace(/^\s*\d+[.)]\s*/, "").trim()).filter(Boolean).join("\n");

export async function gerarNarracao(videoId: number, n: number, vozId: string, texto: string, estabilidade: number, velocidade: number) {
  let { mp3, palavras } = await narrarComTempos(vozId, limparRoteiro(texto), estabilidade);
  const pasta = pastaVideo(videoId, n);
  await mkdir(pasta, { recursive: true });
  const arq = path.join(pasta, "voz.mp3");
  await writeFile(arq, mp3);
  if (Math.abs(velocidade - 1) > 0.01) {
    // acelera/desacelera a voz com ffmpeg e escala os tempos das palavras na mesma proporção
    const tmp = path.join(pasta, "voz-rapida.mp3");
    await exec("ffmpeg", ["-y", "-i", arq, "-filter:a", `atempo=${velocidade}`, tmp]);
    await copyFile(tmp, arq);
    palavras = palavras.map((p: Palavra) => ({ w: p.w, s: p.s / velocidade, e: p.e / velocidade }));
  }
  const duracao = palavras.length ? palavras[palavras.length - 1].e + 0.8 : 5;
  // cópia para a pasta pública do Remotion (usada na renderização)
  const pub = path.join(raiz, "packages", "video", "public", "gen");
  await mkdir(pub, { recursive: true });
  await copyFile(arq, path.join(pub, `${videoId}-v${n}.mp3`));
  return { arquivo: arq, palavras, duracao };
}
