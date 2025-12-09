import { sqliteTable } from "drizzle-orm/sqlite-core";
import * as t from "drizzle-orm/sqlite-core";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { timestamps } from "../db/timestamps.schema";
import { users } from "./user.model";
import { sql } from "drizzle-orm";

export const directories = sqliteTable(
  "directories",
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    name: t.text().notNull(),
    parentId: t.int().references((): AnySQLiteColumn => directories.id),
    ownerId: t
      .int()
      .references(() => users.id)
      .notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (table) => [
    t
      .uniqueIndex("unique_directory_name_coalesced")
      .on(table.name, sql`COALESCE(${table.parentId}, -1)`, table.ownerId),
  ]
);

export type Directory = typeof directories.$inferSelect; // For selecting data
export type NewDirectory = typeof directories.$inferInsert; // For inserting new data
