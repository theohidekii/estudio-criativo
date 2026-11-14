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
