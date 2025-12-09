import { sqliteTable } from "drizzle-orm/sqlite-core";
import * as t from "drizzle-orm/sqlite-core";
import { timestamps } from "../db/timestamps.schema";

export const users = sqliteTable(
  "users",
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    name: t.text(),
    email: t.text().notNull(),
    passwordHash: t.text().notNull(),
    createdAt: timestamps.createdAt,
  },
  (table) => [t.uniqueIndex("email_idx").on(table.email)]
);

export type User = typeof users.$inferSelect; // For selecting data
export type NewUser = typeof users.$inferInsert; // For inserting new data
export type PublicUser = Omit<User, "passwordHash">;
