CREATE TABLE `contas_sociais` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`perfil_id` integer NOT NULL,
	`rede` text NOT NULL,
	`nome_exibicao` text NOT NULL,
	`id_externo` text,
	`token_criptografado` text,
	`expira_em` integer,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`perfil_id`) REFERENCES `perfis`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `fontes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`roteiro_id` integer NOT NULL,
	`url` text NOT NULL,
	`nota` text DEFAULT '' NOT NULL,
	`ressalva` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`roteiro_id`) REFERENCES `roteiros`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notificacoes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`titulo` text NOT NULL,
	`mensagem` text DEFAULT '' NOT NULL,
	`lida` integer DEFAULT false NOT NULL,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `perfis` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`nicho` text DEFAULT '' NOT NULL,
	`tom` text DEFAULT '' NOT NULL,
	`voz_padrao` text,
	`estilo_padrao` text,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `roteiros` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`perfil_id` integer NOT NULL,
	`serie_id` integer,
	`titulo` text NOT NULL,
	`texto` text DEFAULT '' NOT NULL,
	`etapa` text DEFAULT 'ideia' NOT NULL,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`perfil_id`) REFERENCES `perfis`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`serie_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `series` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`perfil_id` integer NOT NULL,
	`nome` text NOT NULL,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`perfil_id`) REFERENCES `perfis`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tarefas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tipo` text NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'pendente' NOT NULL,
	`tentativas` integer DEFAULT 0 NOT NULL,
	`erro` text,
	`agendada_para` integer DEFAULT (unixepoch()) NOT NULL,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`email` text NOT NULL,
	`senha_hash` text NOT NULL,
	`papel` text DEFAULT 'admin' NOT NULL,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_email_unique` ON `usuarios` (`email`);