type Perfil = { nome: string; nicho: string; tom: string } | undefined;

export const instrucaoBase = (p: Perfil) =>
  `Você ajuda uma equipe a criar vídeos curtos animados (vertical, Reels/TikTok/Shorts) em português do Brasil.` +
  (p ? `\nPerfil: ${p.nome}. Nicho: ${p.nicho || "não informado"}. Tom: ${p.tom || "não informado"}.` : "") +
  `\nSeja direto. Não invente fatos: quando citar casos reais, avise o que precisa ser verificado.`;

export const pedidoIdeias = (obs: string) =>
  `Gere 8 ideias de vídeo para este perfil. Para cada uma: título, gancho de abertura (1 frase) e por que funciona.` +
  (obs ? `\nObservações da equipe: ${obs}` : "");
