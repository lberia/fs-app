import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";

const sqlite = new Database("data/sqlite.db");
const db = drizzle(sqlite, { casing: "snake_case" });
migrate(db, { migrationsFolder: "./drizzle" });
