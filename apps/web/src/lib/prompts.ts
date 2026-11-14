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

export const pedidoCenas = (roteiro: string, palavras: { w: string; s: number }[], duracao: number, estilo = "classico") =>
  `${estilo === "volta-por-cima" ? ESQUEMA_VPC : ESQUEMA_CENAS}

Duração total: ${duracao.toFixed(1)} segundos.
Narração (linha por linha):
${roteiro}

Tempo em que cada palavra é falada (segundos):
${palavras.map((p) => `${p.s.toFixed(2)} ${p.w}`).join(" | ")}`;

export const pedidoAjuste = (cenasJson: string, instrucao: string, duracao: number, estilo = "classico") =>
  `${estilo === "volta-por-cima" ? ESQUEMA_VPC : ESQUEMA_CENAS}

Aplique este ajuste ao vídeo e devolva o JSON COMPLETO atualizado (mantenha tudo que não foi pedido para mudar).
Duração total: ${duracao.toFixed(1)} segundos.
Ajuste pedido: ${instrucao}
JSON atual:
${cenasJson}`;

export const pedidoIdeias = (obs: string) =>
  `Gere 8 ideias de vídeo para este perfil. Para cada uma: título, gancho de abertura (1 frase) e por que funciona.` +
  (obs ? `\nObservações da equipe: ${obs}` : "");
