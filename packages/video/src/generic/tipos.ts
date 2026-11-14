// Formato de dados das cenas. Sem imports do Remotion para poder ser usado também no servidor (validação).
export const EXPRESSOES = ["neutral", "stern", "grin", "laugh", "whistle", "nervous", "shock", "relief", "dazed", "pained", "smile", "smile_closed"] as const;
export const CENARIOS = ["sala", "parque", "escuro", "cor", "chapado", "rua", "quarto", "deserto", "colinas", "noite", "templo", "pergaminho", "cozinha"] as const;
export const OBJETOS = ["ovo", "lata", "celular", "controle", "despertador", "nota", "copo", "livro"] as const;
export const ICONES = ["cruz", "coracao", "estrela", "sol", "coroa", "ovni", "olho", "cerebro", "lampada", "relogio", "seta", "interrogacao", "circulo"] as const;
export const ESTILOS = ["classico", "volta-por-cima", "biblia-animada", "mundo-oculto", "matrixxtz-2d", "natan-3d"] as const;
export const OBJETOS3D = ["quadro", "tela", "moeda", "porta", "chave", "mesa", "placa", "arvore", "cadeado", "cofre", "bandeira", "caixa"] as const;
export const ACOES3D = ["parado", "andar", "acenar", "comemorar"] as const;
export const CORES_BARRA = ["vermelho", "verde", "azul", "amarelo"] as const;

export type Estilo = (typeof ESTILOS)[number];
export type Roupa = { jacket: string; pants: string; boots?: string; hat?: "hair" | "cap"; hair?: string; cap?: string; skin?: string; glasses?: boolean; build?: "adult" | "stout" | "kid"; tunica?: string; barba?: string };
export type Personagem = { x: number; y: number; altura: number; expr: (typeof EXPRESSOES)[number]; flip?: boolean; seed?: number; modo?: "stand" | "sit"; roupa: Roupa };
export type Texto = { texto: string; x: number; y: number; tamanho: number; cor?: string; estilo: "etiqueta" | "grande"; aparece?: number };
export type Adesivo = { texto: string; x: number; y: number; cor?: string; rotacao?: number; aparece?: number };
export type Barra = { nome: string; valor: number; texto?: string; cor: (typeof CORES_BARRA)[number] };
export type Hud = { titulo: string; numero: number; barras: Barra[] };
export type Celular = { x: number; y: number; largura: number; titulo: string; tipo: "chat" | "pix"; linhas: { de: "eu" | "ele"; texto: string }[]; aparece?: number };
export type Icone = { tipo: (typeof ICONES)[number]; x: number; y: number; tamanho: number; aparece?: number; destaque?: boolean };
export type Objeto = { tipo: (typeof OBJETOS)[number]; x: number; y: number; tamanho: number; rotacao?: number; flutua?: boolean; aparece?: number };
export type Personagem3D = { id: string; camisa: string; calca?: string; cabelo?: string; pele?: string; estacao?: number; dx: number; dz: number; acao?: (typeof ACOES3D)[number] };
export type Objeto3D = { tipo: (typeof OBJETOS3D)[number]; estacao: number; dx: number; dz: number; escala?: number; cor?: string; rotacao?: number; aparece?: number };
export type Etiqueta3D = { texto: string; estacao: number; dx: number; dz: number; altura: number; aparece?: number };
export type Fecho = { titulo: string; texto: string; destaque?: string };
export type Legenda = { inicio: number; fim: number; texto: string };
export type Cena = {
  inicio: number; // segundos desde o começo do vídeo
  cenario: { tipo: (typeof CENARIOS)[number]; cor?: string; piso?: string; raios?: boolean };
  personagens: Personagem[];
  textos: Texto[];
  adesivos?: Adesivo[];
  celular?: Celular;
  referencia?: string; // citação bíblica, ex.: "Gênesis 6:14"
  // estilo 3D: a câmera visita "estações" (hexágonos) numa trilha; objetos e personagens se acumulam ao longo das cenas
  estacao?: number;
  plano?: "aberto" | "medio" | "close";
  personagens3d?: Personagem3D[];
  objetos3d?: Objeto3D[];
  etiquetas3d?: Etiqueta3D[];
  fecho?: Fecho;
  objetos?: Objeto[]; // objetos de cena (ovo, lata, celular...), com opção de flutuar
  desfoque?: number; // desfoque do fundo em px (profundidade de campo)
  origem?: [number, number]; // ponto do zoom em % da tela (close-up)
  icones?: Icone[];
  hud?: Hud; // se omitido, vale o HUD da cena anterior
  zoom?: [number, number];
  flash?: boolean;
};
export type Cenas = { duracao: number; estilo?: Estilo; destaques?: string[]; legendas?: Legenda[]; cenas: Cena[] };

const num = (v: unknown, a: number, b: number, nome: string) => {
  if (typeof v !== "number" || !Number.isFinite(v) || v < a || v > b) throw new Error(`${nome} inválido (esperado número entre ${a} e ${b})`);
  return v;
};
const cor = (v: unknown, nome: string) => {
  if (typeof v !== "string" || !/^#[0-9a-fA-F]{6}$/.test(v)) throw new Error(`${nome} precisa ser uma cor #rrggbb`);
  return v;
};
const txt = (v: unknown, max: number, nome: string) => {
  if (typeof v !== "string" || !v.trim() || v.length > max) throw new Error(`${nome}: texto vazio ou longo demais (máx. ${max})`);
  return v;
};

/** Agrupa as palavras da narração em legendas de 1 a 3 palavras (estilo de legenda curta e grande). */
export function montarLegendas(palavras: { w: string; s: number; e: number }[], maxPalavras = 3, maxChars = 16, maiusculas = true): Legenda[] {
  const grupos: { w: string; s: number; e: number }[][] = [];
  let atual: { w: string; s: number; e: number }[] = [];
  for (const p of palavras) {
    atual.push(p);
    const fecha = /[.!?:;,]$/.test(p.w) || atual.length >= maxPalavras || atual.map((x) => x.w).join(" ").length >= maxChars;
    if (fecha) { grupos.push(atual); atual = []; }
  }
  if (atual.length) grupos.push(atual);
  return grupos.map((g, i) => ({
    inicio: g[0].s,
    fim: grupos[i + 1] ? grupos[i + 1][0].s : g[g.length - 1].e + 0.3,
    texto: ((t) => (maiusculas ? t.toUpperCase() : t))(g.map((x) => x.w).join(" ").replace(/[.,;:]+$/, "")),
  }));
}

/** Valida e normaliza o JSON vindo da IA ou do editor. Lança Error com mensagem clara. */
export function validarCenas(bruto: unknown, duracao: number): Cenas {
  const o = bruto as { cenas?: unknown; estilo?: unknown; destaques?: unknown; legendas?: unknown };
  if (!o || !Array.isArray(o.cenas) || o.cenas.length === 0) throw new Error("faltou a lista 'cenas'");
  if (o.cenas.length > 60) throw new Error("cenas demais (máx. 60)");
  const estilo: Estilo = ESTILOS.includes(o.estilo as Estilo) ? (o.estilo as Estilo) : "classico";
  const cenas: Cena[] = o.cenas.map((c: any, i: number) => {
    const p = `cena ${i + 1}`;
    c.cenario = { ...(c.cenario ?? {}), tipo: c?.cenario?.tipo ?? "cor" };
    if (!CENARIOS.includes(c.cenario.tipo)) throw new Error(`${p}: cenario.tipo deve ser ${CENARIOS.join(", ")}`);
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
          tunica: r.tunica ? cor(r.tunica, `${p} roupa.tunica`) : undefined, barba: r.barba ? cor(r.barba, `${p} roupa.barba`) : undefined,
        },
      };
    });
    const textos: Texto[] = (c.textos ?? []).slice(0, 5).map((t: any, j: number) => ({
      texto: txt(t?.texto, 60, `${p} texto ${j + 1}`), x: num(t.x, 0, 1080, `${p} texto x`), y: num(t.y, 0, 1920, `${p} texto y`), tamanho: num(t.tamanho, 30, 200, `${p} texto tamanho`),
      cor: t.cor ? cor(t.cor, "cor") : "#ffd54a", estilo: t.estilo === "grande" ? "grande" : "etiqueta", aparece: Number.isFinite(t.aparece) ? Math.max(0, t.aparece) : 0,
    }));
    const adesivos: Adesivo[] = (c.adesivos ?? []).slice(0, 3).map((a: any, j: number) => ({
      texto: txt(a?.texto, 24, `${p} adesivo ${j + 1}`), x: num(a.x, 0, 1080, `${p} adesivo x`), y: num(a.y, 0, 1920, `${p} adesivo y`),
      cor: a.cor ? cor(a.cor, "adesivo cor") : "#e0334a", rotacao: Number.isFinite(a.rotacao) ? Math.max(-20, Math.min(20, a.rotacao)) : -6, aparece: Number.isFinite(a.aparece) ? Math.max(0, a.aparece) : 0,
    }));
    const icones: Icone[] = (c.icones ?? []).slice(0, 4).map((k: any, j: number) => {
      if (!ICONES.includes(k?.tipo)) throw new Error(`${p} icone ${j + 1}: tipo deve ser ${ICONES.join(", ")}`);
      return { tipo: k.tipo, x: num(k.x, 0, 1080, `${p} icone x`), y: num(k.y, 200, 1800, `${p} icone y`), tamanho: Math.max(60, Math.min(450, num(k.tamanho, 0, 5000, `${p} icone tamanho`))), aparece: Number.isFinite(k.aparece) ? Math.max(0, k.aparece) : 0, destaque: !!k.destaque };
    });
    const objetos: Objeto[] = (c.objetos ?? []).slice(0, 6).map((o: any, j: number) => {
      if (!OBJETOS.includes(o?.tipo)) throw new Error(`${p} objeto ${j + 1}: tipo deve ser ${OBJETOS.join(", ")}`);
      return { tipo: o.tipo, x: num(o.x, -100, 1180, `${p} objeto x`), y: num(o.y, 0, 2000, `${p} objeto y`), tamanho: Math.max(60, Math.min(700, num(o.tamanho, 0, 5000, `${p} objeto tamanho`))), rotacao: Number.isFinite(o.rotacao) ? Math.max(-180, Math.min(180, o.rotacao)) : 0, flutua: !!o.flutua, aparece: Number.isFinite(o.aparece) ? Math.max(0, o.aparece) : 0 };
    });
    const e3 = (v: unknown, nome: string) => num(v, 0, 14, nome);
    const personagens3d: Personagem3D[] = (c.personagens3d ?? []).slice(0, 5).map((q: any, j: number) => ({
      id: txt(String(q?.id ?? `p${j}`), 20, `${p} personagem3d id`), camisa: cor(q?.camisa, `${p} personagem3d camisa`), calca: q?.calca ? cor(q.calca, "calca") : "#2c3a66",
      cabelo: q?.cabelo ? cor(q.cabelo, "cabelo") : "#3a2a20", pele: q?.pele ? cor(q.pele, "pele") : "#e8b88c",
      estacao: q?.estacao === undefined ? undefined : e3(q.estacao, `${p} personagem3d estacao`), dx: Math.max(-1.8, Math.min(1.8, num(q?.dx ?? 0, -50, 50, `${p} personagem3d dx`))), dz: Math.max(-1.8, Math.min(1.8, num(q?.dz ?? 0, -50, 50, `${p} personagem3d dz`))),
      acao: ACOES3D.includes(q?.acao) ? q.acao : "parado",
    }));
    const objetos3d: Objeto3D[] = (c.objetos3d ?? []).slice(0, 8).map((o: any, j: number) => {
      if (!OBJETOS3D.includes(o?.tipo)) throw new Error(`${p} objeto3d ${j + 1}: tipo deve ser ${OBJETOS3D.join(", ")}`);
      return { tipo: o.tipo, estacao: e3(o.estacao ?? c.estacao ?? 0, `${p} objeto3d estacao`), dx: Math.max(-2, Math.min(2, num(o.dx ?? 0, -50, 50, `${p} objeto3d dx`))), dz: Math.max(-2, Math.min(2, num(o.dz ?? 0, -50, 50, `${p} objeto3d dz`))),
        escala: Math.max(0.4, Math.min(1.5, Number.isFinite(o.escala) ? o.escala : 1)), cor: o.cor ? cor(o.cor, `${p} objeto3d cor`) : undefined, rotacao: Number.isFinite(o.rotacao) ? o.rotacao : 0, aparece: Number.isFinite(o.aparece) ? Math.max(0, o.aparece) : 0 };
    });
    const etiquetas3d: Etiqueta3D[] = (c.etiquetas3d ?? []).slice(0, 5).map((t: any, j: number) => ({
      texto: txt(t?.texto, 34, `${p} etiqueta3d ${j + 1}`), estacao: e3(t.estacao ?? c.estacao ?? 0, `${p} etiqueta3d estacao`), dx: Math.max(-2.4, Math.min(2.4, num(t.dx ?? 0, -50, 50, `${p} etiqueta3d dx`))), dz: Math.max(-2.4, Math.min(2.4, num(t.dz ?? 0, -50, 50, `${p} etiqueta3d dz`))),
      altura: Math.max(0.3, Math.min(4.5, Number.isFinite(t.altura) ? t.altura : 2)), aparece: Number.isFinite(t.aparece) ? Math.max(0, t.aparece) : 0,
    }));
    const fecho: Fecho | undefined = c.fecho ? { titulo: txt(c.fecho.titulo, 24, `${p} fecho titulo`), texto: txt(c.fecho.texto, 80, `${p} fecho texto`), destaque: typeof c.fecho.destaque === "string" ? c.fecho.destaque.slice(0, 40) : undefined } : undefined;
    const referencia = typeof c.referencia === "string" && c.referencia.trim() ? txt(c.referencia, 40, `${p} referencia`) : undefined;
    let celular: Celular | undefined;
    if (c.celular) {
      const k = c.celular;
      // O celular tem altura 1,9x a largura. Fica entre o HUD (y 270) e o rosto dos personagens (y 820): limitamos tamanho e posição.
      const largura = Math.min(num(k.largura, 200, 520, `${p} celular largura`), 270);
      const meia = (largura * 1.9) / 2;
      celular = {
        x: num(k.x, 0, 1080, `${p} celular x`), y: Math.max(270 + meia, Math.min(820 - meia, num(k.y, 0, 1920, `${p} celular y`))), largura,
        titulo: txt(k.titulo, 30, `${p} celular titulo`), tipo: k.tipo === "pix" ? "pix" : "chat",
        linhas: (k.linhas ?? []).slice(0, 5).map((l: any, j: number) => ({ de: l?.de === "eu" ? "eu" : "ele", texto: txt(l?.texto, 50, `${p} celular linha ${j + 1}`) })),
        aparece: Number.isFinite(k.aparece) ? Math.max(0, k.aparece) : 0,
      };
    }
    let hud: Hud | undefined;
    if (c.hud) {
      const h = c.hud;
      hud = {
        titulo: txt(h.titulo, 24, `${p} hud titulo`), numero: num(h.numero, 0, 9999, `${p} hud numero`),
        barras: (h.barras ?? []).slice(0, 4).map((b: any, j: number) => ({
          nome: txt(b?.nome, 10, `${p} hud barra ${j + 1}`), valor: num(b.valor, 0, 100, `${p} hud valor`), texto: typeof b.texto === "string" ? b.texto.slice(0, 12) : undefined,
          cor: CORES_BARRA.includes(b.cor) ? b.cor : "azul",
        })),
      };
    }
    return {
      inicio: num(c.inicio, 0, duracao, `${p} inicio`),
      cenario: { tipo: c.cenario.tipo, cor: c.cenario.cor ? cor(c.cenario.cor, "cenario.cor") : undefined, piso: c.cenario.piso ? cor(c.cenario.piso, "cenario.piso") : undefined, raios: !!c.cenario.raios },
      personagens, textos, adesivos, celular, hud, icones, referencia, objetos, personagens3d, objetos3d, etiquetas3d, fecho,
      estacao: c.estacao === undefined ? undefined : e3(c.estacao, `${p} estacao`), plano: ["aberto", "medio", "close"].includes(c.plano) ? c.plano : undefined,
      desfoque: Number.isFinite(c.desfoque) ? Math.max(0, Math.min(14, c.desfoque)) : undefined,
      origem: Array.isArray(c.origem) && c.origem.length === 2 ? [Math.max(0, Math.min(100, Number(c.origem[0]) || 50)), Math.max(0, Math.min(100, Number(c.origem[1]) || 50))] : undefined,
      zoom: Array.isArray(c.zoom) && c.zoom.length === 2 ? [num(c.zoom[0], 0.8, 1.6, "zoom"), num(c.zoom[1], 0.8, 1.6, "zoom")] : undefined,
      flash: !!c.flash,
    };
  });
  cenas.sort((a, b) => a.inicio - b.inicio);
  if (cenas[0].inicio !== 0) cenas[0].inicio = 0;
  const destaques = Array.isArray(o.destaques) ? o.destaques.filter((d): d is string => typeof d === "string").slice(0, 40).map((d) => d.toUpperCase()) : undefined;
  const legendas = Array.isArray(o.legendas)
    ? (o.legendas as any[]).slice(0, 400).map((l, i) => ({ inicio: num(l?.inicio, 0, duracao + 5, `legenda ${i + 1} inicio`), fim: num(l?.fim, 0, duracao + 5, `legenda ${i + 1} fim`), texto: txt(l?.texto, 60, `legenda ${i + 1}`) }))
    : undefined;
  return { duracao, estilo, destaques, legendas, cenas };
}

/** Legendas de cada estilo: o clássico não usa; os demais agrupam as palavras com tamanhos próprios. */
export function legendasDoEstilo(estilo: Estilo, palavras: { w: string; s: number; e: number }[]): Legenda[] | undefined {
  if (estilo === "classico") return undefined;
  if (estilo === "mundo-oculto") return montarLegendas(palavras, 6, 34, false);
  if (estilo === "matrixxtz-2d") return montarLegendas(palavras, 4, 24);
  if (estilo === "natan-3d") return montarLegendas(palavras, 1, 99);
  return montarLegendas(palavras, 3);
}

/** Extrai o primeiro objeto JSON completo de um texto da IA, ignorando cercas ``` e qualquer texto antes ou depois. */
export function extrairJson(texto: string): unknown {
  const ini = texto.indexOf("{");
  if (ini < 0) throw new Error("a resposta da IA não tem JSON");
  let prof = 0, emTexto = false, escape = false;
  for (let i = ini; i < texto.length; i++) {
    const c = texto[i];
    if (emTexto) { if (escape) escape = false; else if (c === "\\") escape = true; else if (c === '"') emTexto = false; continue; }
    if (c === '"') emTexto = true;
    else if (c === "{") prof++;
    else if (c === "}" && --prof === 0) return JSON.parse(texto.slice(ini, i + 1));
  }
  throw new Error("o JSON da IA está incompleto (cortado)");
}
