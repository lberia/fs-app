import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/server/models",
  out: "./build/drizzle",
  casing: "snake_case"
});
