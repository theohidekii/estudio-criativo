CREATE TABLE `vozes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provedor` text DEFAULT 'elevenlabs' NOT NULL,
	`id_externo` text NOT NULL,
	`nome` text NOT NULL,
	`categoria` text DEFAULT '' NOT NULL,
	`descricao` text DEFAULT '' NOT NULL,
	`amostra_url` text,
	`estabilidade` real DEFAULT 0.5 NOT NULL,
	`velocidade` real DEFAULT 1 NOT NULL,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vozes_id_externo_unique` ON `vozes` (`id_externo`);