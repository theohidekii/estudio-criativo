// Catálogo de estilos de desenho disponíveis. O desenho em si fica em packages/video/src/generic.
export type EstiloInfo = { id: "classico" | "volta-por-cima" | "biblia-animada"; nome: string; descricao: string; ritmo: string; cores: string[] };

export const ESTILOS_INFO: EstiloInfo[] = [
  { id: "classico", nome: "Clássico", descricao: "Cartoon 2D com cenários simples, etiquetas e legenda em texto grande. Serve para temas sérios, como os da série Mentes diferentes.", ritmo: "Cena de 3 a 4 s, uma ideia por cena", cores: ["#6f9aa6", "#5b7f55", "#ffd54a", "#10172b"] },
  { id: "volta-por-cima", nome: "Volta por Cima", descricao: "Humor em série: vetor chapado, contorno escuro, HUD de jogo no topo, adesivos de ação, telas de celular e legenda grande com palavra colorida.", ritmo: "Cena de 2 a 4 s, legenda de 1 a 3 palavras", cores: ["#ffd23f", "#f0364f", "#3b9cff", "#ff8fb1"] },
  { id: "biblia-animada", nome: "Bíblia Animada", descricao: "Histórias para ver em família: vetor suave de livro infantil, colinas, deserto e noite estrelada, faixa em fita com o tema, selo de categoria e referência com livro, capítulo e versículo.", ritmo: "Cena de 3 a 5 s, legenda de 2 a 3 palavras", cores: ["#f3e3c0", "#2e6fb7", "#c8402f", "#6fb552"] },
];
export const nomeDoEstilo = (id: string) => ESTILOS_INFO.find((e) => e.id === id)?.nome ?? id;
