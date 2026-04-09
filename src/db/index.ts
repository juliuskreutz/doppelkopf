import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

export const db = drizzle({
  connection: {
    url: process.env.DATABASE_URL!,
  },
});

await migrate(db, { migrationsFolder: "./drizzle" });
