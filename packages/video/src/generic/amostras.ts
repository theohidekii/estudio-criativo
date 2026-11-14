// Cenas de exemplo de cada estilo (história original), usadas na galeria de estilos e em testes visuais.
import { montarLegendas, type Cenas } from "./tipos";

const TIAGO = { jacket: "#3b9cff", pants: "#2c3a66", boots: "#f4f1e8", hat: "hair" as const, hair: "#3a2a20", skin: "#f1c19a" };
const LIA = { jacket: "#f0364f", pants: "#2c3a66", boots: "#f4f1e8", hat: "hair" as const, hair: "#c9892f", skin: "#f1c19a" };
const PROF = { jacket: "#35c95f", pants: "#4a3a2a", boots: "#17141f", hat: "hair" as const, hair: "#777777", skin: "#e8b88c", glasses: true, build: "stout" as const };

const fala = "O Tiago esqueceu o prazo. A Lia avisou no grupo. O professor deu a nota. Vai ou some? Vocês decidem.";
const palavras = fala.split(" ").map((w, i) => ({ w, s: i * 0.45, e: i * 0.45 + 0.4 }));

export const AMOSTRA_VPC: Cenas = {
  duracao: 8,
  estilo: "volta-por-cima",
  destaques: ["TIAGO", "PRAZO", "LIA", "NOTA", "SOME"],
  legendas: montarLegendas(palavras),
  cenas: [
    {
      inicio: 0, cenario: { tipo: "parque" },
      hud: { titulo: "Dias pro vestibular", numero: 3, barras: [{ nome: "Mente", valor: 30, cor: "vermelho" }, { nome: "Corpo", valor: 55, cor: "verde" }, { nome: "Cara", valor: 40, cor: "azul" }, { nome: "Grana", valor: 70, texto: "R$ 120", cor: "amarelo" }] },
      personagens: [{ x: 540, y: 1500, altura: 880, expr: "nervous", roupa: TIAGO }],
      textos: [{ texto: "É ele", x: 760, y: 1080, tamanho: 40, estilo: "etiqueta" }],
      adesivos: [], zoom: [1, 1.06],
    },
    {
      inicio: 1.8, cenario: { tipo: "quarto" },
      personagens: [{ x: 360, y: 1500, altura: 820, expr: "smile", roupa: LIA }, { x: 760, y: 1500, altura: 820, expr: "shock", flip: true, roupa: TIAGO }],
      textos: [{ texto: "Grupo da turma", x: 540, y: 330, tamanho: 40, estilo: "etiqueta" }],
      adesivos: [{ texto: "Todo dia", x: 540, y: 1650, rotacao: -6 }],
      celular: { x: 540, y: 690, largura: 300, titulo: "Lia", tipo: "chat", linhas: [{ de: "ele", texto: "Tiago, o prazo é amanhã!" }, { de: "eu", texto: "Que prazo??" }] },
    },
    {
      inicio: 3.8, cenario: { tipo: "chapado", cor: "#ff8fb1", raios: true },
      personagens: [{ x: 540, y: 1500, altura: 900, expr: "dazed", roupa: PROF }],
      textos: [{ texto: "A nota saiu", x: 540, y: 1640, tamanho: 90, estilo: "grande", cor: "#ffffff" }],
      adesivos: [{ texto: "Não largou", x: 700, y: 430, cor: "#17141f" }],
      hud: { titulo: "Dias pro vestibular", numero: 2, barras: [{ nome: "Mente", valor: 20, cor: "vermelho" }, { nome: "Corpo", valor: 55, cor: "verde" }, { nome: "Cara", valor: 35, cor: "azul" }, { nome: "Grana", valor: 70, texto: "R$ 120", cor: "amarelo" }] },
    },
    {
      inicio: 6, cenario: { tipo: "chapado", cor: "#3b4cc0", raios: true },
      personagens: [{ x: 540, y: 1500, altura: 860, expr: "grin", roupa: TIAGO }],
      textos: [], adesivos: [{ texto: "Vocês decidem", x: 540, y: 1700, cor: "#35c95f", rotacao: -4 }],
    },
  ],
};

export const AMOSTRA_CLASSICO: Cenas = {
  duracao: 6,
  estilo: "classico",
  cenas: [
    { inicio: 0, cenario: { tipo: "parque" }, personagens: [{ x: 540, y: 1500, altura: 1000, expr: "smile", roupa: { jacket: "#2d3f5a", pants: "#2a2d36", hat: "cap", cap: "#d1452e" } }], textos: [{ texto: "Ele não parecia perigoso", x: 540, y: 300, tamanho: 90, estilo: "grande", cor: "#ffd54a" }] },
    { inicio: 3, cenario: { tipo: "escuro" }, personagens: [{ x: 540, y: 1500, altura: 1000, expr: "stern", roupa: { jacket: "#c6718f", pants: "#3b4a6b" } }], textos: [{ texto: "1998", x: 540, y: 500, tamanho: 80, estilo: "etiqueta" }] },
  ],
};

const NOE = { jacket: "#c0583a", pants: "#c0583a", boots: "#8a6a3a", hat: "hair" as const, hair: "#9a9a9a", skin: "#d9a577", tunica: "#c0583a", barba: "#9a9a9a" };
const ESPOSA = { jacket: "#3f7fb5", pants: "#3f7fb5", boots: "#8a6a3a", hat: "hair" as const, hair: "#5a3a22", skin: "#e0b088", tunica: "#3f7fb5" };
const falaB = "Deus pediu que Noé construísse uma arca. Noé obedeceu, mesmo sem ver nuvem alguma. Quando a chuva chegou, a família estava segura. Depois veio o arco-íris, um sinal de promessa.";
const palavrasB = falaB.split(" ").map((w, i) => ({ w, s: i * 0.5, e: i * 0.5 + 0.44 }));

export const AMOSTRA_BIBLIA: Cenas = {
  duracao: 14,
  estilo: "biblia-animada",
  destaques: ["DEUS", "NOÉ", "ARCA", "CHUVA", "PROMESSA", "ARCO-ÍRIS"],
  legendas: montarLegendas(palavrasB, 3),
  cenas: [
    { inicio: 0, cenario: { tipo: "colinas" }, personagens: [{ x: 540, y: 1480, altura: 880, expr: "smile", roupa: NOE }],
      textos: [{ texto: "História · Gênesis", x: 540, y: 270, tamanho: 36, estilo: "etiqueta" }, { texto: "Noé e a arca", x: 540, y: 460, tamanho: 76, estilo: "grande" }], referencia: "Gênesis 6:14", icones: [{ tipo: "sol", x: 880, y: 640, tamanho: 140 }] },
    { inicio: 3.6, cenario: { tipo: "deserto" }, personagens: [{ x: 540, y: 1480, altura: 880, expr: "neutral", roupa: NOE }],
      textos: [{ texto: "Obedecer sem ver", x: 540, y: 460, tamanho: 70, estilo: "grande", cor: "#c8402f" }], icones: [] },
    { inicio: 7, cenario: { tipo: "noite" }, personagens: [{ x: 340, y: 1480, altura: 800, expr: "relief", roupa: NOE }, { x: 760, y: 1480, altura: 800, expr: "smile", flip: true, roupa: ESPOSA }],
      textos: [{ texto: "A chuva chega", x: 540, y: 460, tamanho: 76, estilo: "grande" }], icones: [{ tipo: "estrela", x: 180, y: 700, tamanho: 110 }] },
    { inicio: 10.4, cenario: { tipo: "pergaminho" }, personagens: [{ x: 540, y: 1480, altura: 820, expr: "smile", roupa: ESPOSA }],
      textos: [{ texto: "Um sinal de promessa", x: 540, y: 460, tamanho: 70, estilo: "grande", cor: "#c8402f" }], referencia: "Gênesis 9:13", icones: [{ tipo: "coracao", x: 880, y: 760, tamanho: 130 }] },
  ],
};

const CIENTISTA = { jacket: "#d9d4ee", pants: "#6a5fa0", boots: "#2a2440", hat: "hair" as const, hair: "#3a2a20", skin: "#f1c19a", glasses: true };
const falaM = "O polvo tem três corações. Dois levam o sangue até as brânquias. O terceiro leva o sangue para o resto do corpo. E o sangue dele é azul, por causa do cobre.";
const palavrasM = falaM.split(" ").map((w, i) => ({ w, s: i * 0.42, e: i * 0.42 + 0.38 }));

export const AMOSTRA_MUNDO: Cenas = {
  duracao: 12,
  estilo: "mundo-oculto",
  destaques: ["TRÊS", "CORAÇÕES", "AZUL", "COBRE"],
  legendas: montarLegendas(palavrasM, 6, 34, false),
  cenas: [
    { inicio: 0, cenario: { tipo: "escuro" }, personagens: [{ x: 540, y: 1560, altura: 760, expr: "shock", roupa: CIENTISTA }],
      textos: [{ texto: "polvo?", x: 800, y: 1040, tamanho: 60, estilo: "etiqueta", cor: "#ff4d4d" }], icones: [{ tipo: "interrogacao", x: 260, y: 980, tamanho: 220 }] },
    { inicio: 3.6, cenario: { tipo: "escuro" }, personagens: [],
      textos: [{ texto: "brânquias", x: 300, y: 1450, tamanho: 60, estilo: "etiqueta" }, { texto: "corpo", x: 800, y: 1450, tamanho: 60, estilo: "etiqueta" }],
      icones: [{ tipo: "coracao", x: 300, y: 1000, tamanho: 250, destaque: true }, { tipo: "coracao", x: 540, y: 1180, tamanho: 220, destaque: true }, { tipo: "coracao", x: 800, y: 1000, tamanho: 250, destaque: true, aparece: 0.7 }, { tipo: "seta", x: 540, y: 1330, tamanho: 180, aparece: 1.2 }] },
    { inicio: 8, cenario: { tipo: "escuro" }, personagens: [],
      textos: [{ texto: "Cu", x: 540, y: 1560, tamanho: 110, estilo: "grande", cor: "#ff4d4d" }], icones: [{ tipo: "olho", x: 540, y: 1000, tamanho: 360 }, { tipo: "circulo", x: 540, y: 1000, tamanho: 470, aparece: 0.8 }] },
  ],
};

const RAFA = { jacket: "#e9e2cf", pants: "#5d7a52", boots: "#4a3a2a", hat: "hair" as const, hair: "#2e2018", skin: "#c98e5d", barba: "#2e2018" };
const MARI = { jacket: "#b5533c", pants: "#3f4a5e", boots: "#3a2a22", hat: "hair" as const, hair: "#4a2e1c", skin: "#d9a577" };
const falaC = "E se tu acordasse com telecinese? Primeiro, o controle voa. Depois, a lata. Aí tu pensa: calma, eu preciso de um café. E o café vem sozinho.";
const palavrasC = falaC.split(" ").map((w, i) => ({ w, s: i * 0.42, e: i * 0.42 + 0.38 }));

export const AMOSTRA_CINEMA: Cenas = {
  duracao: 11,
  estilo: "matrixxtz-2d",
  destaques: ["TELECINESE", "CONTROLE", "LATA", "CAFÉ"],
  legendas: montarLegendas(palavrasC, 4, 24),
  cenas: [
    { inicio: 0, cenario: { tipo: "sala" }, desfoque: 3, personagens: [{ x: 600, y: 1520, altura: 880, expr: "dazed", modo: "sit", roupa: RAFA }],
      textos: [], objetos: [{ tipo: "controle", x: 250, y: 780, tamanho: 150, rotacao: 30, flutua: true }, { tipo: "lata", x: 880, y: 640, tamanho: 140, flutua: true }, { tipo: "ovo", x: 430, y: 560, tamanho: 110, flutua: true, aparece: 0.6 }], zoom: [1, 1.08] },
    { inicio: 3.6, cenario: { tipo: "cozinha" }, desfoque: 5, personagens: [{ x: 540, y: 1560, altura: 1000, expr: "shock", roupa: MARI }],
      textos: [], objetos: [{ tipo: "copo", x: 800, y: 1040, tamanho: 220, flutua: true }], zoom: [1.05, 1.22], origem: [50, 28] },
    { inicio: 7.2, cenario: { tipo: "sala" }, desfoque: 4, personagens: [{ x: 540, y: 1560, altura: 960, expr: "smile", roupa: RAFA }],
      textos: [], objetos: [{ tipo: "despertador", x: 840, y: 860, tamanho: 180, flutua: true }, { tipo: "livro", x: 220, y: 900, tamanho: 170, rotacao: -20, flutua: true }], zoom: [1, 1.1] },
  ],
};
