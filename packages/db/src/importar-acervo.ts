// Importa o acervo antigo (roteiros em Markdown + vídeos renderizados do projeto my-video) para o sistema.
// Uso: npx tsx packages/db/src/importar-acervo.ts --origem "<pasta do my-video>" [--roteiros "<pasta de .md>"]
// Idempotente: roda de novo sem duplicar. Os MP4 são copiados para storage/acervo/ (fora do git).
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { abrirBanco } from "./index";
import { migrarBanco } from "./migrar";
import { perfis, roteiros, series, versoesVideo, videos } from "./schema";

const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : undefined; };
const origem = arg("origem");
if (!origem) { console.error('Informe --origem "<pasta do my-video>"'); process.exit(1); }
const raiz = path.resolve(import.meta.dirname, "../../..");
const pastaRoteiros = arg("roteiros") ?? path.join(raiz, "docs", "roteiros");
const destino = path.join(raiz, "storage", "acervo");
mkdirSync(destino, { recursive: true });

type Item = { comp: string; titulo: string; md?: string; extra?: string; mp4: string[]; serie?: string };
const ACERVO: Item[] = [
  { comp: "MilgramP1", titulo: "Milgram, parte 1", md: "milgram-parte1.md", mp4: ["milgram1/milgram_parte1_rascunho.mp4", "milgram1/milgram_parte1_v2.mp4", "milgram1/milgram_parte1_v3.mp4"] },
  { comp: "MilgramP2", titulo: "Milgram, parte 2", mp4: ["milgram2/milgram_parte2_v1.mp4"] },
  { comp: "TermanP1", titulo: "Terman e Alvarez, parte 1", md: "terman-alvarez-parte1.md", mp4: ["terman/terman_parte1_v1.mp4"] },
  { comp: "TempoP1", titulo: "O tempo passa rápido", md: "tempo-passa-rapido.md", mp4: ["tempo/tempo_v1.mp4"] },
  { comp: "MarshallP1", titulo: "Marshall e a bactéria", md: "marshall-bacteria.md", mp4: ["marshall/marshall_v1.mp4"] },
  { comp: "ManiacoP1", titulo: "Maníaco do Parque", md: "psicopata-maniaco-do-parque.md", mp4: ["maniaco/maniaco_v1.mp4"], serie: "Mentes diferentes" },
  { comp: "DanielP1", titulo: "Daniel Markel, vídeo promocional", extra: "out/daniel2/script.txt", mp4: ["daniel/daniel_v1.mp4", "daniel2/daniel_v2.mp4", "daniel3/daniel_v3.mp4"] },
  { comp: "BridgeShort", titulo: "A ponte que caiu por uma música", mp4: [] },
];
const SO_ROTEIRO: { md: string; titulo: string; etapa: "ideia" | "rascunho" | "aprovado"; serie?: string }[] = [
  { md: "psicopata-fallon.md", titulo: "James Fallon: o cérebro de um psicopata", etapa: "aprovado", serie: "Mentes diferentes" },
  { md: "relogio-cronostase.md", titulo: "Relógio e cronóstase", etapa: "rascunho" },
];

const db = migrarBanco(abrirBanco(process.env.DATABASE_PATH ?? path.join(raiz, "storage", "estudio.db")));

let perfil = db.select().from(perfis).where(eq(perfis.nome, "Acervo importado")).get();
if (!perfil) perfil = db.insert(perfis).values({ nome: "Acervo importado", nicho: "Psicologia humana e curiosidades", tom: "Sério, curioso e respeitoso" }).returning().get();
const serieId = (nome?: string) => {
  if (!nome) return null;
  const s = db.select().from(series).where(and(eq(series.perfilId, perfil!.id), eq(series.nome, nome))).get()
    ?? db.insert(series).values({ perfilId: perfil!.id, nome }).returning().get();
  return s.id;
};

/** Extrai o roteiro numerado (seção "## Roteiro") de um .md; devolve também o título do arquivo. */
function lerMd(arquivo: string) {
  const md = readFileSync(arquivo, "utf-8");
  const titulo = (md.match(/^#\s+(.+)$/m)?.[1] ?? path.basename(arquivo)).replace(/^Série[^:]*:\s*/i, "").trim();
  const sec = md.split(/^##\s+/m).find((s) => /^Roteiro/i.test(s));
  const texto = sec ? sec.split("\n").slice(1).filter((l) => /^\d+\.\s/.test(l.trim())).map((l) => l.trim()).join("\n") : "";
  return { md, titulo, texto };
}
const duracao = (f: string) => {
  try { return Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim()) || null; } catch { return null; }
};
function garantirRoteiro(titulo: string, texto: string, pesquisa: string, etapa: "ideia" | "rascunho" | "aprovado" | "gravado", serie?: string) {
  const ja = db.select().from(roteiros).where(and(eq(roteiros.perfilId, perfil!.id), eq(roteiros.titulo, titulo))).get();
  if (ja) return ja;
  return db.insert(roteiros).values({ perfilId: perfil!.id, serieId: serieId(serie), titulo, texto, pesquisa, etapa }).returning().get();
}

let nR = 0, nV = 0, nVer = 0;
for (const it of ACERVO) {
  let texto = "", pesquisa = "";
  if (it.md && existsSync(path.join(pastaRoteiros, it.md))) { const m = lerMd(path.join(pastaRoteiros, it.md)); texto = m.texto; pesquisa = m.md; }
  if (it.extra && existsSync(path.join(origem, it.extra))) texto = readFileSync(path.join(origem, it.extra), "utf-8").trim();
  const r = garantirRoteiro(it.titulo, texto, pesquisa, it.mp4.length ? "gravado" : "rascunho", it.serie);
  nR++;
  let v = db.select().from(videos).where(eq(videos.composicao, it.comp)).get();
  if (!v) { v = db.insert(videos).values({ roteiroId: r.id, titulo: it.titulo, composicao: it.comp }).returning().get(); nV++; }
  const feitas = db.select().from(versoesVideo).where(eq(versoesVideo.videoId, v.id)).all().length;
  it.mp4.forEach((rel, i) => {
    if (i < feitas) return; // já importada
    const src = path.join(origem, "out", rel);
    if (!existsSync(src)) { console.warn("  sem arquivo:", rel); return; }
    const dst = path.join(destino, `${it.comp}-v${i + 1}.mp4`);
    if (!existsSync(dst)) copyFileSync(src, dst);
    db.insert(versoesVideo).values({ videoId: v!.id, numero: i + 1, status: "pronto", duracao: duracao(dst), arquivoVideo: dst }).run();
    nVer++;
  });
  if (!it.mp4.length && feitas === 0) db.insert(versoesVideo).values({ videoId: v.id, numero: 1, status: "cenas_prontas" }).run();
}
for (const s of SO_ROTEIRO) {
  const arq = path.join(pastaRoteiros, s.md);
  if (!existsSync(arq)) continue;
  const m = lerMd(arq);
  garantirRoteiro(s.titulo, m.texto, m.md, s.etapa, s.serie);
  nR++;
}
console.log(`Acervo: ${nR} roteiros verificados, ${nV} vídeos novos, ${nVer} versões de vídeo novas.`);
