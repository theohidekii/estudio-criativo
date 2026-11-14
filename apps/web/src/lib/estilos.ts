// Catálogo de estilos de desenho disponíveis. O desenho em si fica em packages/video/src/generic.
export type EstiloInfo = { id: "classico" | "volta-por-cima" | "biblia-animada" | "mundo-oculto" | "matrixxtz-2d"; nome: string; descricao: string; ritmo: string; cores: string[] };

export const ESTILOS_INFO: EstiloInfo[] = [
  { id: "classico", nome: "Clássico", descricao: "Cartoon 2D com cenários simples, etiquetas e legenda em texto grande. Serve para temas sérios, como os da série Mentes diferentes.", ritmo: "Cena de 3 a 4 s, uma ideia por cena", cores: ["#6f9aa6", "#5b7f55", "#ffd54a", "#10172b"] },
  { id: "volta-por-cima", nome: "Volta por Cima", descricao: "Humor em série: vetor chapado, contorno escuro, HUD de jogo no topo, adesivos de ação, telas de celular e legenda grande com palavra colorida.", ritmo: "Cena de 2 a 4 s, legenda de 1 a 3 palavras", cores: ["#ffd23f", "#f0364f", "#3b9cff", "#ff8fb1"] },
  { id: "biblia-animada", nome: "Bíblia Animada", descricao: "Histórias para ver em família: vetor suave de livro infantil, colinas, deserto e noite estrelada, faixa em fita com o tema, selo de categoria e referência com livro, capítulo e versículo.", ritmo: "Cena de 3 a 5 s, legenda de 2 a 3 palavras", cores: ["#f3e3c0", "#2e6fb7", "#c8402f", "#6fb552"] },
  { id: "mundo-oculto", nome: "Mundo Oculto", descricao: "Curiosidades e ciência em quadro de giz: linhas brancas com tremor de desenho à mão sobre roxo escuro, ícones que se desenham sozinhos e a frase da narração escrita no topo, com destaque em vermelho.", ritmo: "Cena de 2 a 4 s, frase inteira no topo", cores: ["#1c1033", "#f4f0ff", "#ff4d4d", "#2a1850"] },
  { id: "matrixxtz-2d", nome: "Matrixxtz 2D", descricao: "Humor e ciência do dia a dia com cara de cinema: 2D quente e dessaturado, fundo desfocado, luz de janela, grão de filme, objetos que flutuam e legenda branca condensada com uma palavra em cor.", ritmo: "Cena de 1,8 a 3 s, legenda de 2 a 4 palavras", cores: ["#b39478", "#f2e6cc", "#f0b23c", "#e0483a"] },
];
export const nomeDoEstilo = (id: string) => ESTILOS_INFO.find((e) => e.id === id)?.nome ?? id;
