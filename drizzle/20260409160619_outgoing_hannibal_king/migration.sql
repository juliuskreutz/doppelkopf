CREATE TABLE `game_players` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`game` integer NOT NULL,
	`player` integer NOT NULL,
	`winner` integer NOT NULL,
	CONSTRAINT `fk_game_players_game_games_id_fk` FOREIGN KEY (`game`) REFERENCES `games`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_game_players_player_players_id_fk` FOREIGN KEY (`player`) REFERENCES `players`(`id`)
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`session` integer NOT NULL,
	`type` text NOT NULL,
	`points` integer NOT NULL,
	`ram` integer NOT NULL,
	`createdAt` text DEFAULT (CURRENT_TIME),
	CONSTRAINT `fk_games_session_sessions_id_fk` FOREIGN KEY (`session`) REFERENCES `sessions`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session_players` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`session` integer NOT NULL,
	`player` integer NOT NULL,
	CONSTRAINT `fk_session_players_session_sessions_id_fk` FOREIGN KEY (`session`) REFERENCES `sessions`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_session_players_player_players_id_fk` FOREIGN KEY (`player`) REFERENCES `players`(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `game_players_game_idx` ON `game_players` (`game`);--> statement-breakpoint
CREATE INDEX `games_session_idx` ON `games` (`session`);--> statement-breakpoint
CREATE INDEX `session_players_session_idx` ON `session_players` (`session`);