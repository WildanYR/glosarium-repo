import { 
  bigserial, 
  pgTable, 
  text, 
  timestamp, 
  varchar, 
  index, 
  customType 
} from "drizzle-orm/pg-core";
import { SQL, sql } from "drizzle-orm";

const tsvector = customType<{ data: string }>({
  dataType() { return "tsvector"; },
});

export const timestampColumn = {
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
};

export const glosariumTable = pgTable('glosarium', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  word: varchar('word', { length: 255 }).notNull().unique(),
  meaning: text('meaning').notNull(),
  meaning_vector: tsvector("meaning_vector").generatedAlwaysAs(
    (): SQL => sql`to_tsvector('simple'::regconfig, meaning)`
  ),
  ...timestampColumn
}, (table) => [
  index("meaning_search_idx").using("gin", table.meaning_vector),
  index("word_prefix_idx").using("btree", table.word.asc().op("varchar_pattern_ops")),
]);

export const glosariumHashTable = pgTable('glosarium_hash', {
  word: varchar('word', {length: 255}).primaryKey(),
  hash: varchar('hash').notNull()
})

export const glosariumMetadataTable = pgTable('glosarium_metadata', {
  key: varchar('key', {length: 255}).primaryKey(),
  value: varchar('value').notNull()
})