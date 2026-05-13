import { defineConfig } from "drizzle-kit";

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL env not found')
}

export default defineConfig({
  schema: "./src/databases/schemas/postgres.schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL,
  },
  migrations: {
    schema: 'public',
  },
});