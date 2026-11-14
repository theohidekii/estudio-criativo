// Consultas de métricas: último snapshot de cada publicação, totais, série no tempo e melhores horários.
import { desc } from "drizzle-orm";
import { contasSociais, metricasSnapshot, publicacoes } from "@estudio/db";
import { db } from "./db";

export type Snap = typeof metricasSnapshot.$inferSelect;
export type Linha = {
  id: number; rede: string; titulo: string; url: string; publicadoEm: Date | null; perfilId: number; contaNome: string; videoId: number | null; m: Snap | null;
};

export const fmt = (n: number | null | undefined) => (n === null || n === undefined ? "–" : n.toLocaleString("pt-BR"));
export const fmtTempo = (s: number | null | undefined) => (s === null || s === undefined ? "–" : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`);
export const fmtPct = (p: number | null | undefined) => (p === null || p === undefined ? "–" : `${p.toFixed(0)}%`);

export function carregar(filtro: { perfilId?: number; desde?: Date } = {}) {
  const d = db();
  const contas = new Map(d.select().from(contasSociais).all().map((c) => [c.id, c]));
  const snaps = d.select().from(metricasSnapshot).orderBy(desc(metricasSnapshot.coletadoEm), desc(metricasSnapshot.id)).all();
  const ultimo = new Map<number, Snap>();
  for (const s of snaps) if (!ultimo.has(s.publicacaoId)) ultimo.set(s.publicacaoId, s);
  let linhas: Linha[] = d.select().from(publicacoes).all().map((p) => {
    const c = contas.get(p.contaId);
    return { id: p.id, rede: p.rede, titulo: p.titulo, url: p.url, publicadoEm: p.publicadoEm, perfilId: c?.perfilId ?? 0, contaNome: c?.nomeExibicao ?? "", videoId: p.videoId, m: ultimo.get(p.id) ?? null };
  });
  if (filtro.perfilId) linhas = linhas.filter((l) => l.perfilId === filtro.perfilId);
  if (filtro.desde) linhas = linhas.filter((l) => !l.publicadoEm || l.publicadoEm >= filtro.desde!);
  return { linhas, snaps };
}

export function totais(linhas: Linha[]) {
  const soma = (f: (m: Snap) => number | null) => linhas.reduce((a, l) => a + (l.m ? (f(l.m) ?? 0) : 0), 0);
  const porRede = new Map<string, number>();
  for (const l of linhas) porRede.set(l.rede, (porRede.get(l.rede) ?? 0) + (l.m?.views ?? 0));
  return { publicacoes: linhas.length, views: soma((m) => m.views), curtidas: soma((m) => m.curtidas), comentarios: soma((m) => m.comentarios), compartilhamentos: soma((m) => m.compartilhamentos), salvamentos: soma((m) => m.salvamentos), porRede: [...porRede.entries()].sort((a, b) => b[1] - a[1]) };
}

/** Views somadas por dia: em cada dia vale o último snapshot de cada publicação até o fim daquele dia. */
export function serieViews(linhas: Linha[], snaps: Snap[], dias: number): { x: string; y: number }[] {
  const ids = new Set(linhas.map((l) => l.id));
  const porPub = new Map<number, Snap[]>();
  for (const s of snaps) if (ids.has(s.publicacaoId)) { const a = porPub.get(s.publicacaoId) ?? []; a.push(s); porPub.set(s.publicacaoId, a); }
  porPub.forEach((a) => a.sort((x, y) => +x.coletadoEm - +y.coletadoEm));
  const hoje = new Date(); hoje.setHours(23, 59, 59, 999);
  const out: { x: string; y: number }[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const fim = new Date(hoje.getTime() - i * 864e5);
    let y = 0;
    porPub.forEach((a) => { let v: Snap | undefined; for (const s of a) if (+s.coletadoEm <= +fim) v = s; if (v) y += v.views; });
    out.push({ x: fim.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), y });
  }
  return out;
}

const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
/** Média de views por dia da semana e por faixa de horário de publicação. Só mostra quando há volume mínimo (8 publicações com data). */
export function melhoresHorarios(linhas: Linha[]) {
  const com = linhas.filter((l) => l.publicadoEm && l.m);
  if (com.length < 8) return { suficiente: false as const, total: com.length };
  const media = (chave: (d: Date) => string) => {
    const g = new Map<string, number[]>();
    for (const l of com) { const k = chave(l.publicadoEm!); g.set(k, [...(g.get(k) ?? []), l.m!.views]); }
    return [...g.entries()].filter(([, v]) => v.length >= 2).map(([k, v]) => ({ k, media: v.reduce((a, b) => a + b, 0) / v.length, n: v.length })).sort((a, b) => b.media - a.media);
  };
  return {
    suficiente: true as const, total: com.length,
    dias: media((d) => DIAS[d.getDay()]).slice(0, 3),
    horas: media((d) => `${String(Math.floor(d.getHours() / 3) * 3).padStart(2, "0")}h–${String(Math.floor(d.getHours() / 3) * 3 + 2).padStart(2, "0")}h`).slice(0, 3),
  };
}
