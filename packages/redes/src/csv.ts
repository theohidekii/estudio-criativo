import type { MetricasRemotas, Rede } from "./tipos";

export type LinhaCsv = { rede: Rede; titulo: string; url: string; publicadoEm: Date | null; metricas: MetricasRemotas };
const REDES: Rede[] = ["instagram", "tiktok", "facebook", "youtube"];

const dividir = (linha: string, sep: string) => {
  const out: string[] = [];
  let atual = "", aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (c === '"') { if (aspas && linha[i + 1] === '"') { atual += '"'; i++; } else aspas = !aspas; }
    else if (c === sep && !aspas) { out.push(atual); atual = ""; }
    else atual += c;
  }
  out.push(atual);
  return out.map((x) => x.trim());
};
const num = (v: string | undefined) => {
  if (v === undefined || v === "") return null;
  const n = Number(v.replace(/\./g, "").replace(",", ".").replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
};
const norm = (h: string) => h.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");

/** Lê um CSV (vírgula ou ponto e vírgula) com colunas: rede, titulo, url, data, views, curtidas, comentarios, compartilhamentos, salvamentos, alcance, tempo_medio, retencao. */
export function lerCsv(texto: string): { linhas: LinhaCsv[]; erros: string[] } {
  const brutas = texto.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (brutas.length < 2) return { linhas: [], erros: ["O arquivo precisa de um cabeçalho e ao menos uma linha."] };
  const sep = brutas[0].split(";").length > brutas[0].split(",").length ? ";" : ",";
  const cab = dividir(brutas[0], sep).map(norm);
  const col = (...nomes: string[]) => cab.findIndex((c) => nomes.includes(c));
  const ix = {
    rede: col("rede", "plataforma"), titulo: col("titulo", "title", "legenda"), url: col("url", "link"), data: col("data", "publicadoem", "datadepublicacao"),
    views: col("views", "visualizacoes"), curtidas: col("curtidas", "likes"), comentarios: col("comentarios", "comments"), compart: col("compartilhamentos", "shares"),
    salv: col("salvamentos", "salvos", "saves"), alcance: col("alcance", "reach"), tempo: col("tempomedio", "tempomediodevisualizacao"), ret: col("retencao"),
  };
  if (ix.rede < 0 || ix.titulo < 0) return { linhas: [], erros: ["Faltam as colunas obrigatórias: rede e titulo."] };
  const linhas: LinhaCsv[] = [];
  const erros: string[] = [];
  brutas.slice(1).forEach((l, n) => {
    const c = dividir(l, sep);
    const g = (i: number) => (i >= 0 ? c[i] : undefined);
    const rede = norm(g(ix.rede) ?? "") as Rede;
    if (!REDES.includes(rede)) { erros.push(`Linha ${n + 2}: rede inválida "${g(ix.rede)}" (use instagram, tiktok, facebook ou youtube).`); return; }
    const d = g(ix.data);
    const data = d ? new Date(/^\d{2}\/\d{2}\/\d{4}$/.test(d) ? d.split("/").reverse().join("-") : d) : null;
    linhas.push({
      rede, titulo: g(ix.titulo) ?? "", url: g(ix.url) ?? "", publicadoEm: data && !isNaN(+data) ? data : null,
      metricas: { views: num(g(ix.views)) ?? 0, curtidas: num(g(ix.curtidas)) ?? 0, comentarios: num(g(ix.comentarios)) ?? 0, compartilhamentos: num(g(ix.compart)) ?? 0, salvamentos: num(g(ix.salv)) ?? 0, alcance: num(g(ix.alcance)), tempoMedio: num(g(ix.tempo)), retencao: num(g(ix.ret)), seguidoresGanhos: null },
    });
  });
  return { linhas, erros };
}
