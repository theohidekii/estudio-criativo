CREATE TABLE `agentes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`usuario_id` integer NOT NULL,
	`nome` text NOT NULL,
	`token_hash` text NOT NULL,
	`ultimo_contato` integer,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agentes_token_hash_unique` ON `agentes` (`token_hash`);--> statement-breakpoint
CREATE TABLE `conversas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`usuario_id` integer NOT NULL,
	`perfil_id` integer,
	`titulo` text DEFAULT 'Nova conversa' NOT NULL,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`perfil_id`) REFERENCES `perfis`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `mensagens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversa_id` integer NOT NULL,
	`papel` text NOT NULL,
	`texto` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pronta' NOT NULL,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`conversa_id`) REFERENCES `conversas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `tarefas` ADD `usuario_id` integer;