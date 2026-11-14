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

export const pedidoIdeias =(obs: string) =>
  `Gere 8 ideias de vídeo para este perfil. Para cada uma: título, gancho de abertura (1 frase) e por que funciona.` +
  (obs ? `\nObservações da equipe: ${obs}` : "");
