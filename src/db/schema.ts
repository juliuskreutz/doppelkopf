import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const playersTable = sqliteTable("players", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
});

export const sessionsTable = sqliteTable("sessions", {
  id: integer().primaryKey({ autoIncrement: true }),
  createdAt: text().notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const sessionPlayersTable = sqliteTable(
  "session_players",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    session: integer()
      .notNull()
      .references(() => sessionsTable.id, { onDelete: "cascade" }),
    player: integer()
      .notNull()
      .references(() => playersTable.id),
  },
  (t) => [index("session_players_session_idx").on(t.session)],
);

export const gamesTable = sqliteTable(
  "games",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    session: integer()
      .notNull()
      .references(() => sessionsTable.id, { onDelete: "cascade" }),
    type: text({ enum: ["normal", "solo", "silent"] }).notNull(),
    points: integer().notNull(),
    ram: integer({ mode: "boolean" }).notNull(),
    createdAt: text().default(sql`(CURRENT_TIME)`),
  },
  (t) => [index("games_session_idx").on(t.session)],
);

export const gamePlayersTable = sqliteTable(
  "game_players",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    game: integer()
      .notNull()
      .references(() => gamesTable.id, { onDelete: "cascade" }),
    player: integer()
      .notNull()
      .references(() => playersTable.id),
    winner: integer({ mode: "boolean" }).notNull(),
  },
  (t) => [index("game_players_game_idx").on(t.game)],
);
