import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const id = () => integer("id").primaryKey({ autoIncrement: true });
const criadoEm = () =>
  integer("criado_em", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`);

export const usuarios = sqliteTable("usuarios", {
  id: id(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senhaHash: text("senha_hash").notNull(),
  papel: text("papel", { enum: ["admin", "editor"] }).notNull().default("admin"),
  criadoEm: criadoEm(),
});

export const perfis = sqliteTable("perfis", {
  id: id(),
  nome: text("nome").notNull(),
  nicho: text("nicho").notNull().default(""),
  tom: text("tom").notNull().default(""),
  vozPadrao: text("voz_padrao"),
  estiloPadrao: text("estilo_padrao"),
  criadoEm: criadoEm(),
});

export const contasSociais = sqliteTable("contas_sociais", {
  id: id(),
  perfilId: integer("perfil_id").notNull().references(() => perfis.id, { onDelete: "cascade" }),
  rede: text("rede", { enum: ["instagram", "tiktok", "facebook", "youtube"] }).notNull(),
  nomeExibicao: text("nome_exibicao").notNull(),
  idExterno: text("id_externo"),
  tokenCriptografado: text("token_criptografado"),
  expiraEm: integer("expira_em", { mode: "timestamp" }),
  refreshTokenCriptografado: text("refresh_token_criptografado"),
  extra: text("extra").notNull().default("{}"), // JSON: ids específicos da rede (ex.: igUserId, pageId, canal)
  ultimaColeta: integer("ultima_coleta", { mode: "timestamp" }),
  erro: text("erro"),
  criadoEm: criadoEm(),
});

export const series = sqliteTable("series", {
  id: id(),
  perfilId: integer("perfil_id").notNull().references(() => perfis.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  criadoEm: criadoEm(),
});

export const roteiros = sqliteTable("roteiros", {
  id: id(),
  perfilId: integer("perfil_id").notNull().references(() => perfis.id, { onDelete: "cascade" }),
  serieId: integer("serie_id").references(() => series.id, { onDelete: "set null" }),
  titulo: text("titulo").notNull(),
  texto: text("texto").notNull().default(""),
  pesquisa: text("pesquisa").notNull().default(""),
  etapa: text("etapa", { enum: ["ideia", "rascunho", "aprovado", "gravado", "publicado"] })
    .notNull()
    .default("ideia"),
  criadoEm: criadoEm(),
});

export const fontes = sqliteTable("fontes", {
  id: id(),
  roteiroId: integer("roteiro_id").notNull().references(() => roteiros.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  nota: text("nota").notNull().default(""),
  ressalva: text("ressalva").notNull().default(""),
});

export const tarefas = sqliteTable("tarefas", {
  id: id(),
  tipo: text("tipo").notNull(),
  usuarioId: integer("usuario_id"),
  payload: text("payload").notNull().default("{}"),
  status: text("status", { enum: ["pendente", "executando", "concluida", "falhou"] })
    .notNull()
    .default("pendente"),
  tentativas: integer("tentativas").notNull().default(0),
  erro: text("erro"),
  agendadaPara: integer("agendada_para", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  criadoEm: criadoEm(),
});

export const notificacoes = sqliteTable("notificacoes", {
  id: id(),
  titulo: text("titulo").notNull(),
  mensagem: text("mensagem").notNull().default(""),
  lida: integer("lida", { mode: "boolean" }).notNull().default(false),
  criadoEm: criadoEm(),
});

/** Agente local de cada membro. O token só é guardado como hash. */
export const agentes = sqliteTable("agentes", {
  id: id(),
  usuarioId: integer("usuario_id").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  ultimoContato: integer("ultimo_contato", { mode: "timestamp" }),
  criadoEm: criadoEm(),
});

export const conversas = sqliteTable("conversas", {
  id: id(),
  usuarioId: integer("usuario_id").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
  perfilId: integer("perfil_id").references(() => perfis.id, { onDelete: "set null" }),
  titulo: text("titulo").notNull().default("Nova conversa"),
  criadoEm: criadoEm(),
});

export const mensagens = sqliteTable("mensagens", {
  id: id(),
  conversaId: integer("conversa_id").notNull().references(() => conversas.id, { onDelete: "cascade" }),
  papel: text("papel", { enum: ["usuario", "ia"] }).notNull(),
  texto: text("texto").notNull().default(""),
  status: text("status", { enum: ["pendente", "pronta", "erro"] }).notNull().default("pronta"),
  criadoEm: criadoEm(),
});

export const vozes = sqliteTable("vozes", {
  id: id(),
  provedor: text("provedor").notNull().default("elevenlabs"),
  idExterno: text("id_externo").notNull().unique(),
  nome: text("nome").notNull(),
  categoria: text("categoria").notNull().default(""),
  descricao: text("descricao").notNull().default(""),
  amostraUrl: text("amostra_url"),
  estabilidade: real("estabilidade").notNull().default(0.5),
  velocidade: real("velocidade").notNull().default(1),
  criadoEm: criadoEm(),
});

export const videos = sqliteTable("videos", {
  id: id(),
  roteiroId: integer("roteiro_id").notNull().references(() => roteiros.id, { onDelete: "cascade" }),
  titulo: text("titulo").notNull(),
  formato: text("formato", { enum: ["vertical", "horizontal"] }).notNull().default("vertical"),
  estilo: text("estilo").notNull().default("classico"), // pacote visual: classico | volta-por-cima
  composicao: text("composicao"), // id da composição própria do Remotion (vídeos importados ou feitos à mão)
  criadoEm: criadoEm(),
});

/** Cada geração/ajuste do vídeo vira uma versão (v1, v2, v3…). */
export const versoesVideo = sqliteTable("versoes_video", {
  id: id(),
  videoId: integer("video_id").notNull().references(() => videos.id, { onDelete: "cascade" }),
  numero: integer("numero").notNull(),
  status: text("status", { enum: ["rascunho", "voz_pronta", "cenas_prontas", "renderizando", "pronto", "erro"] }).notNull().default("rascunho"),
  vozIdExterno: text("voz_id_externo"),
  palavras: text("palavras").notNull().default("[]"), // [{w, s, e}] em segundos
  duracao: real("duracao"),
  cenas: text("cenas"), // JSON validado (packages/video/src/generic/tipos.ts)
  arquivoVoz: text("arquivo_voz"),
  arquivoVideo: text("arquivo_video"),
  erro: text("erro"),
  criadoEm: criadoEm(),
});

/** Vídeo publicado em uma rede (importado da API ou cadastrado à mão), opcionalmente ligado a um vídeo do sistema. */
export const publicacoes = sqliteTable("publicacoes", {
  id: id(),
  contaId: integer("conta_id").notNull().references(() => contasSociais.id, { onDelete: "cascade" }),
  rede: text("rede", { enum: ["instagram", "tiktok", "facebook", "youtube"] }).notNull(),
  idExterno: text("id_externo").notNull(),
  titulo: text("titulo").notNull().default(""),
  url: text("url").notNull().default(""),
  publicadoEm: integer("publicado_em", { mode: "timestamp" }),
  videoId: integer("video_id").references(() => videos.id, { onDelete: "set null" }),
  criadoEm: criadoEm(),
}, (t) => [uniqueIndex("publicacoes_conta_externo").on(t.contaId, t.idExterno)]);

/** Histórico: uma linha por coleta (a cada hora pela API, ou à mão). */
export const metricasSnapshot = sqliteTable("metricas_snapshot", {
  id: id(),
  publicacaoId: integer("publicacao_id").notNull().references(() => publicacoes.id, { onDelete: "cascade" }),
  coletadoEm: integer("coletado_em", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  views: integer("views").notNull().default(0),
  curtidas: integer("curtidas").notNull().default(0),
  comentarios: integer("comentarios").notNull().default(0),
  compartilhamentos: integer("compartilhamentos").notNull().default(0),
  salvamentos: integer("salvamentos").notNull().default(0),
  alcance: integer("alcance"),
  tempoMedio: real("tempo_medio"), // segundos
  retencao: real("retencao"), // % do vídeo assistido em média
  seguidoresGanhos: integer("seguidores_ganhos"),
  fonte: text("fonte", { enum: ["api", "manual"] }).notNull().default("api"),
});
