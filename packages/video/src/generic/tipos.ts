// Formato de dados das cenas. Sem imports do Remotion para poder ser usado também no servidor (validação).
export const EXPRESSOES = ["neutral", "stern", "grin", "laugh", "whistle", "nervous", "shock", "relief", "dazed", "pained", "smile", "smile_closed"] as const;
export const CENARIOS = ["sala", "parque", "escuro", "cor"] as const;

export type Roupa = { jacket: string; pants: string; boots?: string; hat?: "hair" | "cap"; hair?: string; cap?: string; skin?: string; glasses?: boolean; build?: "adult" | "stout" | "kid" };
export type Personagem = { x: number; y: number; altura: number; expr: (typeof EXPRESSOES)[number]; flip?: boolean; seed?: number; modo?: "stand" | "sit"; roupa: Roupa };
export type Texto = { texto: string; x: number; y: number; tamanho: number; cor?: string; estilo: "etiqueta" | "grande"; aparece?: number };
export type Cena = {
  inicio: number; // segundos desde o começo do vídeo
  cenario: { tipo: (typeof CENARIOS)[number]; cor?: string; piso?: string };
  personagens: Personagem[];
  textos: Texto[];
  zoom?: [number, number];
  flash?: boolean;
};
export type Cenas = { duracao: number; cenas: Cena[] };

const num = (v: unknown, a: number, b: number, nome: string) => {
  if (typeof v !== "number" || !Number.isFinite(v) || v < a || v > b) throw new Error(`${nome} inválido (esperado número entre ${a} e ${b})`);
  return v;
};
const cor = (v: unknown, nome: string) => {
  if (typeof v !== "string" || !/^#[0-9a-fA-F]{6}$/.test(v)) throw new Error(`${nome} precisa ser uma cor #rrggbb`);
  return v;
};

/** Valida e normaliza o JSON vindo da IA ou do editor. Lança Error com mensagem clara. */
export function validarCenas(bruto: unknown, duracao: number): Cenas {
  const o = bruto as { cenas?: unknown };
  if (!o || !Array.isArray(o.cenas) || o.cenas.length === 0) throw new Error("faltou a lista 'cenas'");
  if (o.cenas.length > 60) throw new Error("cenas demais (máx. 60)");
  const cenas: Cena[] = o.cenas.map((c: any, i: number) => {
    const p = `cena ${i + 1}`;
    if (!CENARIOS.includes(c?.cenario?.tipo)) throw new Error(`${p}: cenario.tipo deve ser ${CENARIOS.join(", ")}`);
    const personagens: Personagem[] = (c.personagens ?? []).slice(0, 6).map((q: any, j: number) => {
      if (!EXPRESSOES.includes(q?.expr)) throw new Error(`${p} personagem ${j + 1}: expr inválida (${EXPRESSOES.join(", ")})`);
      const r = q.roupa ?? {};
      return {
        x: num(q.x, -200, 1280, `${p} x`), y: num(q.y, 300, 2200, `${p} y`), altura: num(q.altura, 300, 1800, `${p} altura`),
        expr: q.expr, flip: !!q.flip, seed: Number.isFinite(q.seed) ? q.seed : j + 1, modo: q.modo === "sit" ? "sit" : "stand",
        roupa: {
          jacket: cor(r.jacket, `${p} roupa.jacket`), pants: cor(r.pants, `${p} roupa.pants`), boots: r.boots ? cor(r.boots, "boots") : "#1c1a19",
          hat: r.hat === "cap" ? "cap" : "hair", hair: r.hair ? cor(r.hair, "hair") : "#3a2a20", cap: r.cap ? cor(r.cap, "cap") : undefined,
          skin: r.skin ? cor(r.skin, "skin") : "#f5c9a0", glasses: !!r.glasses, build: ["stout", "kid"].includes(r.build) ? r.build : "adult",
        },
      };
    });
    const textos: Texto[] = (c.textos ?? []).slice(0, 5).map((t: any, j: number) => {
      if (typeof t?.texto !== "string" || !t.texto.trim() || t.texto.length > 60) throw new Error(`${p} texto ${j + 1}: texto vazio ou longo demais (máx. 60)`);
      return {
        texto: t.texto, x: num(t.x, 0, 1080, `${p} texto x`), y: num(t.y, 0, 1920, `${p} texto y`), tamanho: num(t.tamanho, 30, 200, `${p} texto tamanho`),
        cor: t.cor ? cor(t.cor, "cor") : "#ffd54a", estilo: t.estilo === "grande" ? "grande" : "etiqueta", aparece: Number.isFinite(t.aparece) ? Math.max(0, t.aparece) : 0,
      };
    });
    return {
      inicio: num(c.inicio, 0, duracao, `${p} inicio`),
      cenario: { tipo: c.cenario.tipo, cor: c.cenario.cor ? cor(c.cenario.cor, "cenario.cor") : undefined, piso: c.cenario.piso ? cor(c.cenario.piso, "cenario.piso") : undefined },
      personagens, textos,
      zoom: Array.isArray(c.zoom) && c.zoom.length === 2 ? [num(c.zoom[0], 0.8, 1.6, "zoom"), num(c.zoom[1], 0.8, 1.6, "zoom")] : undefined,
      flash: !!c.flash,
    };
  });
  cenas.sort((a, b) => a.inicio - b.inicio);
  if (cenas[0].inicio !== 0) cenas[0].inicio = 0;
  return { duracao, cenas };
}
