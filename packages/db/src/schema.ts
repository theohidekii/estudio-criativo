import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
