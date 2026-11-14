CREATE TABLE `metricas_snapshot` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`publicacao_id` integer NOT NULL,
	`coletado_em` integer DEFAULT (unixepoch()) NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`curtidas` integer DEFAULT 0 NOT NULL,
	`comentarios` integer DEFAULT 0 NOT NULL,
	`compartilhamentos` integer DEFAULT 0 NOT NULL,
	`salvamentos` integer DEFAULT 0 NOT NULL,
	`alcance` integer,
	`tempo_medio` real,
	`retencao` real,
	`seguidores_ganhos` integer,
	`fonte` text DEFAULT 'api' NOT NULL,
	FOREIGN KEY (`publicacao_id`) REFERENCES `publicacoes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `publicacoes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conta_id` integer NOT NULL,
	`rede` text NOT NULL,
	`id_externo` text NOT NULL,
	`titulo` text DEFAULT '' NOT NULL,
	`url` text DEFAULT '' NOT NULL,
	`publicado_em` integer,
	`video_id` integer,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`conta_id`) REFERENCES `contas_sociais`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `publicacoes_conta_externo` ON `publicacoes` (`conta_id`,`id_externo`);--> statement-breakpoint
ALTER TABLE `contas_sociais` ADD `refresh_token_criptografado` text;--> statement-breakpoint
ALTER TABLE `contas_sociais` ADD `extra` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `contas_sociais` ADD `ultima_coleta` integer;--> statement-breakpoint
ALTER TABLE `contas_sociais` ADD `erro` text;