CREATE TABLE `versoes_video` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`video_id` integer NOT NULL,
	`numero` integer NOT NULL,
	`status` text DEFAULT 'rascunho' NOT NULL,
	`voz_id_externo` text,
	`palavras` text DEFAULT '[]' NOT NULL,
	`duracao` real,
	`cenas` text,
	`arquivo_voz` text,
	`arquivo_video` text,
	`erro` text,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`roteiro_id` integer NOT NULL,
	`titulo` text NOT NULL,
	`formato` text DEFAULT 'vertical' NOT NULL,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`roteiro_id`) REFERENCES `roteiros`(`id`) ON UPDATE no action ON DELETE cascade
);
