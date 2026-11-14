type Perfil = { nome: string; nicho: string; tom: string } | undefined;

export const instrucaoBase = (p: Perfil) =>
  `Você ajuda uma equipe a criar vídeos curtos animados (vertical, Reels/TikTok/Shorts) em português do Brasil.` +
  (p ? `\nPerfil: ${p.nome}. Nicho: ${p.nicho || "não informado"}. Tom: ${p.tom || "não informado"}.` : "") +
  `\nSeja direto. Não invente fatos: quando citar casos reais, avise o que precisa ser verificado.`;

export const pedidoPesquisa = (titulo: string, texto: string) =>
  `Pesquise na web os fatos para este vídeo e entregue em português, em markdown, com estas seções:
## Fatos confirmados (cada um com a fonte entre parênteses)
## Pontos em que as fontes divergem (e o que dizer no vídeo por isso)
## O que evitar (números incertos, afirmações sem prova, detalhes sensíveis)
Seja honesto: se não achou algo, diga que não achou. Não invente fontes.
Título: ${titulo}
Roteiro/ideia atual: ${texto || "(ainda sem texto)"}`;

export const pedidoRascunho = (titulo: string, pesquisa: string, texto: string) =>
  `Escreva um roteiro de narração de 35 a 45 segundos (cerca de 100 a 130 palavras) para um vídeo vertical animado.
Formato: linhas numeradas, uma ideia por linha, gancho forte na primeira. Sem emojis, sem CTA, números por extenso.
Use SOMENTE fatos da pesquisa abaixo; respeite as ressalvas e o "o que evitar".
Título: ${titulo}
Pesquisa:
${pesquisa || "(sem pesquisa; avise que os fatos precisam ser verificados)"}
${texto ? `Rascunho atual para melhorar:\n${texto}` : ""}
Responda só com o roteiro.`;

const ESQUEMA_CENAS = `Responda SOMENTE com JSON válido (sem markdown, sem comentários) neste formato:
{"duracao": <segundos>, "cenas": [{
  "inicio": <segundos, a primeira é 0>,
  "cenario": {"tipo": "sala"|"parque"|"escuro"|"cor", "cor": "#rrggbb" (opcional), "piso": "#rrggbb" (opcional)},
  "personagens": [{"x": 0-1080, "y": 1400-1600 (altura dos pés), "altura": 800-1200, "expr": "neutral|stern|grin|laugh|whistle|nervous|shock|relief|dazed|pained|smile|smile_closed", "flip": false, "seed": 1,
     "roupa": {"jacket": "#rrggbb", "pants": "#rrggbb", "hat": "hair"|"cap", "hair": "#rrggbb", "cap": "#rrggbb", "skin": "#rrggbb", "glasses": false}}],
  "textos": [{"texto": "...", "x": 540, "y": 150-1700, "tamanho": 60-110, "cor": "#rrggbb", "estilo": "grande"|"etiqueta", "aparece": <segundos dentro da cena>}],
  "zoom": [1, 1.1], "flash": false }]}
Regras de layout (tela vertical 1080x1920):
- Troque de cena a cada 2 a 4 segundos, sempre no início de uma frase ou de uma palavra-chave da narração (use os tempos fornecidos). Entre 12 e 22 cenas.
- Etiqueta: no máximo 22 caracteres. Texto grande: tamanho até 90 e no máximo 2 linhas (cerca de 16 caracteres por linha). Nunca coloque dois textos a menos de 200 px de distância vertical.
- No máximo 3 personagens por cena; com 2 ou 3, espalhe o x (ex.: 270, 540, 810) e reduza a altura (600 a 800). Mantenha os mesmos personagens com a mesma roupa em todo o vídeo.
- Mostre só o que a narração diz. Tom sério quando o tema for crime ou tragédia: sem violência, sem sangue, sem humor.
- Use "escuro" para momentos de tensão e conclusão, "parque" para ambientes externos, "sala" para ambientes internos.`;

const ESQUEMA_VPC = `Responda SOMENTE com JSON válido (sem markdown, sem comentários) no estilo "Volta por Cima": humor em série, vetor chapado, cores vivas, ritmo rápido.
{"duracao": <segundos>, "estilo": "volta-por-cima", "destaques": ["PALAVRA", ...],
 "cenas": [{
  "inicio": <segundos, a primeira é 0>,
  "cenario": {"tipo": "parque"|"rua"|"quarto"|"chapado"|"escuro", "cor": "#rrggbb" (opcional), "raios": true (só em "chapado")},
  "personagens": [{"x": 0-1080, "y": 1450-1600, "altura": 700-900, "expr": "neutral|stern|grin|laugh|nervous|shock|relief|dazed|pained|smile|smile_closed", "flip": false, "seed": 1,
     "roupa": {"jacket": "#rrggbb", "pants": "#rrggbb", "hat": "hair"|"cap", "hair": "#rrggbb", "cap": "#rrggbb", "skin": "#rrggbb", "glasses": false, "build": "adult"|"stout"|"kid"}}],
  "textos": [{"texto": "...", "x": 0-1080, "y": 250-1800, "tamanho": 40, "estilo": "etiqueta"|"grande", "aparece": <segundos dentro da cena>}],
  "adesivos": [{"texto": "...", "x": 0-1080, "y": 250-1800, "cor": "#rrggbb", "rotacao": -8..8, "aparece": 0.3}],
  "celular": {"x": 540, "y": 700, "largura": 300, "titulo": "Nome do contato", "tipo": "chat"|"pix", "linhas": [{"de": "eu"|"ele", "texto": "..."}]},
  "hud": {"titulo": "Dias pro ...", "numero": 24, "barras": [{"nome": "Mente", "valor": 0-100, "texto": "30%", "cor": "vermelho"|"verde"|"azul"|"amarelo"}]},
  "zoom": [1, 1.06], "flash": false }]}
O sistema desenha a LEGENDA sozinho a partir da narração; não escreva legendas. Em "destaques" liste de 6 a 20 palavras da narração (em maiúsculas, sem pontuação) que merecem cor: nomes, números e viradas de humor.
Regras de layout (tela vertical 1080x1920):
- O HUD ocupa y < 260 e a legenda ocupa a faixa y 1000 a 1260: não coloque textos nem celular nessas faixas. Rostos dos personagens ficam acima de y 1000.
- Troque de cena a cada 2 a 4 segundos, na virada de cada frase. Entre 10 e 22 cenas. Alterne cenários (cor chapada com raios para reviravolta e emoção, parque ou quarto para contexto).
- Use "hud" na primeira cena e atualize os valores quando algo muda a história (o HUD vale até a próxima cena que o altere). Só use HUD se o roteiro tiver um prazo ou contagem; senão omita.
- "etiqueta": no máximo 20 caracteres, sobre o personagem a que se refere (ex.: "O EX"). "adesivo": 1 a 3 palavras de ação ("NÃO LARGOU", "TODO DIA"), no máximo 1 por cena. "celular" quando a narração fala de mensagem, foto ou Pix: largura 250 a 270 e y por volta de 540 (o sistema ajusta se passar).
- No máximo 3 personagens por cena; com 2 ou 3, espalhe o x (270, 540, 810) e use altura 650 a 750. Mantenha cada personagem com a mesma roupa em todo o vídeo.
- Tom: humor leve e ágil. Se o tema for crime ou tragédia, não use este estilo: avise no campo "estilo" trocando para "classico".`;

const ESQUEMA_BIBLIA = `Responda SOMENTE com JSON válido (sem markdown, sem comentários) no estilo "Bíblia Animada": histórias bíblicas para ver em família, vetor suave de livro infantil, tom respeitoso e acolhedor.
{"duracao": <segundos>, "estilo": "biblia-animada", "destaques": ["PALAVRA", ...],
 "cenas": [{
  "inicio": <segundos, a primeira é 0>,
  "cenario": {"tipo": "colinas"|"deserto"|"noite"|"templo"|"pergaminho", "cor": "#rrggbb" (opcional)},
  "personagens": [{"x": 0-1080, "y": 1450-1550, "altura": 760-900, "expr": "neutral|stern|smile|smile_closed|relief|nervous|shock|dazed|pained|grin", "flip": false, "seed": 1,
     "roupa": {"tunica": "#rrggbb", "jacket": "#rrggbb (igual à túnica)", "pants": "#rrggbb (igual à túnica)", "boots": "#8a6a3a", "hat": "hair", "hair": "#rrggbb", "skin": "#rrggbb", "barba": "#rrggbb" (opcional)}}],
  "textos": [{"texto": "...", "x": 540, "y": 250-560, "tamanho": 36-76, "estilo": "grande"|"etiqueta", "cor": "#2e6fb7" ou "#c8402f" (só para "grande"), "aparece": <segundos dentro da cena>}],
  "referencia": "Livro capítulo:versículo" (opcional),
  "icones": [{"tipo": "cruz"|"coracao"|"estrela"|"sol"|"coroa", "x": 0-1080, "y": 500-900, "tamanho": 100-160, "aparece": 0.3}],
  "zoom": [1, 1.05], "flash": false }]}
O sistema desenha a LEGENDA sozinho a partir da narração; não escreva legendas. Em "destaques" liste de 6 a 16 palavras da narração (maiúsculas, sem pontuação): nomes, lugares e a palavra central de cada virada.
Regras de conteúdo:
- Fidelidade acima de tudo: use SOMENTE versículos e referências que já aparecem no roteiro. Nunca invente nem complete um versículo; se o roteiro não cita capítulo e versículo, omita "referencia".
- Sem violência explícita nem sangue; mostre o contexto (lugar, expressão, sinal) e não o ato. Personagens com túnicas em cores terrosas, sem rostos de realismo.
Regras de layout (tela vertical 1080x1920):
- Faixa ("grande") e selo ("etiqueta") ficam em y 250 a 560, acima dos personagens. A referência fica em y 1352 e a legenda em y 1480 a 1700: não coloque nada nessas faixas.
- A primeira cena tem um selo de categoria (ex.: "HISTÓRIA · GÊNESIS") e a faixa com o tema. Nas demais, uma faixa curta (até 22 caracteres) quando muda o assunto.
- Toda cena precisa de uma ilustração: pelo menos 1 personagem. Só a cena "pergaminho" pode ficar sem personagem, e então use um ícone grande (tamanho 220 a 300, y por volta de 760).
- Troque de cena a cada 3 a 5 segundos, na virada de cada frase. Entre 8 e 16 cenas. Alterne cenários: colinas (dia e campo), deserto, noite (promessa, mistério), templo (lugares sagrados), pergaminho (leitura e versículo).
- No máximo 3 personagens por cena; com 2 ou 3, espalhe o x e use altura 650 a 760. Cada personagem mantém a mesma roupa em todo o vídeo.`;

const ESQUEMA_MUNDO = `Responda SOMENTE com JSON válido (sem markdown, sem comentários) no estilo "Mundo Oculto": curiosidades e ciência explicadas em desenhos de giz, linhas brancas sobre roxo escuro, com destaques em vermelho.
{"duracao": <segundos>, "estilo": "mundo-oculto", "destaques": ["PALAVRA", ...],
 "cenas": [{
  "inicio": <segundos, a primeira é 0>,
  "cenario": {"tipo": "escuro"},
  "personagens": [{"x": 0-1080, "y": 1500-1600, "altura": 650-800, "expr": "neutral|stern|smile|shock|nervous|relief|dazed|pained|grin", "flip": false, "seed": 1,
     "roupa": {"jacket": "#rrggbb", "pants": "#rrggbb", "hat": "hair", "hair": "#rrggbb", "skin": "#rrggbb", "glasses": false}}],
  "icones": [{"tipo": "ovni"|"olho"|"cerebro"|"lampada"|"relogio"|"seta"|"interrogacao"|"circulo"|"coracao"|"estrela"|"sol", "x": 0-1080, "y": 600-1350, "tamanho": 160-380, "destaque": true|false, "aparece": <segundos dentro da cena>}],
  "textos": [{"texto": "palavra ou 2 a 3 palavras", "x": 0-1080, "y": 600-1500, "tamanho": 56-72, "estilo": "etiqueta", "cor": "#ff4d4d" (opcional), "aparece": <segundos dentro da cena>}],
  "zoom": [1, 1.05], "flash": false }]}
O sistema escreve sozinho, em letra manuscrita no topo, cada frase da narração; não escreva legendas. Em "destaques" liste de 6 a 16 palavras da narração (maiúsculas, sem pontuação): números, nomes e a ideia central de cada virada.
Regras de conteúdo:
- Fidelidade: afirme somente o que está no roteiro. Não acrescente números, datas ou fatos novos nos desenhos nem nas anotações.
- Desenhe o conceito: cada cena é um pequeno infográfico de giz feito de ícones, setas e anotações curtas, como um quadro de explicação. Personagens são opcionais (0 a 2): use-os para reações e para quem faz a pergunta.
Regras de layout (tela vertical 1080x1920):
- O topo (y < 560) é da frase manuscrita: não coloque nada lá. Os desenhos ocupam y 700 a 1500: centralize o conjunto em torno de y 1100, usando bem o espaço (ícones grandes, 280 a 400) e deixando margem nas laterais.
- Troque de cena a cada 2 a 4 segundos, na virada de cada frase. Entre 8 e 20 cenas. Até 4 ícones por cena, escalonando "aparece" (0, 0.6, 1.2...) para que se desenhem em sequência; use "circulo" em vermelho para chamar atenção a algo e "seta" para mostrar sentido ou causa.
- Anotações ("etiqueta"): no máximo 3 palavras, perto do desenho a que se referem. Use a cor vermelha só para o dado mais importante da cena.`;

const ESQUEMA_CINEMA = `Responda SOMENTE com JSON válido (sem markdown, sem comentários) no estilo "Matrixxtz 2D": humor e ciência do dia a dia, 2D quente e dessaturado com cara de cinema, ritmo rápido.
{"duracao": <segundos>, "estilo": "matrixxtz-2d", "destaques": ["PALAVRA", ...],
 "cenas": [{
  "inicio": <segundos, a primeira é 0>,
  "cenario": {"tipo": "sala"|"quarto"|"cozinha"|"rua"|"parque"|"noite"},
  "desfoque": 2-6,
  "personagens": [{"x": 0-1080, "y": 1500-1600, "altura": 800-1050, "expr": "neutral|stern|smile|smile_closed|shock|nervous|relief|dazed|pained|grin|laugh", "flip": false, "seed": 1,
     "roupa": {"jacket": "#rrggbb", "pants": "#rrggbb", "hat": "hair", "hair": "#rrggbb", "skin": "#rrggbb", "barba": "#rrggbb" (opcional), "glasses": false}}],
  "objetos": [{"tipo": "ovo"|"lata"|"celular"|"controle"|"despertador"|"nota"|"copo"|"livro", "x": 0-1080, "y": 500-1400, "tamanho": 120-320, "rotacao": -45..45, "flutua": true|false, "aparece": <segundos dentro da cena>}],
  "zoom": [1, 1.1], "origem": [50, 30] (ponto do zoom em %), "flash": false }]}
O sistema escreve sozinho a LEGENDA branca no terço inferior a partir da narração; não escreva legendas. Em "destaques" liste de 6 a 16 palavras da narração (maiúsculas, sem pontuação): a palavra-chave de cada frase e as viradas de humor.
Linguagem do estilo:
- Cenas curtas, de 1,8 a 3 s, com um corte a cada frase ou virada. Entre 12 e 24 cenas. Alterne planos: plano aberto (zoom [1, 1.08]), close no rosto (zoom [1.15, 1.35] com "origem" [50, 25]) e close em mãos e objetos (zoom [1.2, 1.4] com "origem" no objeto).
- Ganchos hipotéticos funcionam bem ("E se tu...?"). Objetos com "flutua": true dão o efeito de telecinese ou de coisas fora do lugar; use quando a narração falar de algo voando, caindo ou fora de controle.
- Cores de roupa quentes e dessaturadas (terrosos, creme, verde-musgo, azul-acinzentado), nunca neon. Cada personagem mantém a mesma roupa no vídeo todo.
Regras de layout (tela vertical 1080x1920):
- A legenda ocupa y 1380 a 1650: evite objetos importantes nessa faixa. Rostos ficam em y 650 a 1000 (aproximadamente), então objetos não devem cobri-los.
- No máximo 2 personagens por cena; com 2, use x 330 e 750 e altura 800 a 880. Não use "modo": "sit". Cada cena precisa de pelo menos 1 personagem ou 1 objeto grande (close).
- Humor leve e acolhedor. Mantenha-se fiel ao roteiro: não invente fatos, números ou nomes.`;

const esquemaDo = (estilo: string) => (estilo === "volta-por-cima" ? ESQUEMA_VPC : estilo === "biblia-animada" ? ESQUEMA_BIBLIA : estilo === "mundo-oculto" ? ESQUEMA_MUNDO : estilo === "matrixxtz-2d" ? ESQUEMA_CINEMA : ESQUEMA_CENAS);

export const pedidoCenas = (roteiro: string, palavras: { w: string; s: number }[], duracao: number, estilo = "classico") =>
  `${esquemaDo(estilo)}

Duração total: ${duracao.toFixed(1)} segundos.
Narração (linha por linha):
${roteiro}

Tempo em que cada palavra é falada (segundos):
${palavras.map((p) => `${p.s.toFixed(2)} ${p.w}`).join(" | ")}`;

export const pedidoAjuste = (cenasJson: string, instrucao: string, duracao: number, estilo = "classico") =>
  `${esquemaDo(estilo)}

Aplique este ajuste ao vídeo e devolva o JSON COMPLETO atualizado (mantenha tudo que não foi pedido para mudar).
Duração total: ${duracao.toFixed(1)} segundos.
Ajuste pedido: ${instrucao}
JSON atual:
${cenasJson}`;

export const pedidoIdeias = (obs: string) =>
  `Gere 8 ideias de vídeo para este perfil. Para cada uma: título, gancho de abertura (1 frase) e por que funciona.` +
  (obs ? `\nObservações da equipe: ${obs}` : "");
