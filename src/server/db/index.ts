import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { Database } from "bun:sqlite";

const sqlite = new Database("data/sqlite.db");
export const db = drizzle(sqlite, { casing: "snake_case" });

export function createTestDB() {
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite, { casing: "snake_case" });
  migrate(db, { migrationsFolder: "./drizzle" });

  return db;
}

export function cleanupTestDB(db: ReturnType<typeof createTestDB>) {
  db.$client.close();
}
