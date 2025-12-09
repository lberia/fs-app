import { sqliteTable } from "drizzle-orm/sqlite-core";
import * as t from "drizzle-orm/sqlite-core";
import { timestamps } from "../db/timestamps.schema";
import { directories } from "./directory.model";
import { users } from "./user.model";
import { Column, sql, type AnyColumn } from "drizzle-orm";

export const files = sqliteTable(
  "files",
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    name: t.text().notNull(),
    directoryId: t.int().references(() => directories.id),
    uri: t.text().notNull(),
    size: t.int(),
    mimeType: t.text(),
    ownerId: t
      .int()
      .notNull()
      .references(() => users.id),
    ...timestamps,
  },
  (table) => [
    t
      .uniqueIndex("unique_file_name_coalesced")
      .on(table.name, sql`COALESCE(${table.directoryId}, -1)`, table.ownerId),
  ]
);

export type File = typeof files.$inferSelect; // For selecting data
export type NewFile = typeof files.$inferInsert; // For inserting new data
