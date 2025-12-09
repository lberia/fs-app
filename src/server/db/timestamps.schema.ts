import { integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const timestamps = {
  updatedAt: integer({ mode: "timestamp" })
    .notNull()
    .$defaultFn(() => sql`(unixepoch())`),
  createdAt: integer({ mode: "timestamp" })
    .notNull()
    .$defaultFn(() => sql`(unixepoch())`),
  deletedAt: integer({ mode: "timestamp" }),
};
