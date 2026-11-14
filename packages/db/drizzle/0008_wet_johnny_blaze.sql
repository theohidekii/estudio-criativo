CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`versao_id` integer NOT NULL,
	`legenda_base` text DEFAULT '' NOT NULL,
	`agendado_para` integer NOT NULL,
	`status` text DEFAULT 'agendado' NOT NULL,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`versao_id`) REFERENCES `versoes_video`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `posts_rede` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`conta_id` integer NOT NULL,
	`rede` text NOT NULL,
	`legenda` text,
	`titulo` text,
	`privacidade` text DEFAULT 'private' NOT NULL,
	`status` text DEFAULT 'pendente' NOT NULL,
	`id_externo` text,
	`url` text,
	`erro` text,
	`tentativas` integer DEFAULT 0 NOT NULL,
	`publicado_em` integer,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`conta_id`) REFERENCES `contas_sociais`(`id`) ON UPDATE no action ON DELETE cascade
);
