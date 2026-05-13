import { drizzle } from "drizzle-orm/bun-sql";
import { POSTGRES_URL } from "../configs/database.config";

export const postgresDB = drizzle(POSTGRES_URL)