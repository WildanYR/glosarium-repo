import { eq, gt, sql } from "drizzle-orm";
import { GlosariumUpdatePayload } from "../types/glosarium-update.type";
import { postgresDB } from "../databases/postgres-db";
import { glosariumHashTable, glosariumMetadataTable, glosariumTable } from "../databases/schemas/postgres.schema";
import { GLOSARIUM_VERSION } from "../constants/metadata.const";
import { xxHash32 } from "js-xxhash";

export function checkSafetyPin(pin?: string): {status: string; message: string} {
  const safetyPin = process.env.SAFETY_PIN
  if (pin !== safetyPin) {
    return {status: 'error', message: 'Pin tidak cocok'}
  }

  return {status: 'success', message: 'Pin cocok'}
}

export async function getSyncStatus() {
   const rows = await postgresDB
     .select({ value: glosariumMetadataTable.value })
     .from(glosariumMetadataTable)
     .where(eq(glosariumMetadataTable.key, GLOSARIUM_VERSION))
     .limit(1);
   
   const version = rows.length > 0 ? rows[0].value : 'initial';
   return { version };
}

export async function* getAllHashes() {
  const chunkSize = 500;
  let lastWord: string | null = null; 
  let hasMore = true;

  while(hasMore) {
    const whereClause: any = lastWord ? gt(glosariumHashTable.word, lastWord) : undefined;

    const rows = await postgresDB
      .select()
      .from(glosariumHashTable)
      .where(whereClause)
      .orderBy(glosariumHashTable.word)
      .limit(chunkSize);

    if (rows.length === 0) {
      hasMore = false;
      break;
    }

    for (const row of rows) {
      yield row;
    }

    lastWord = rows[rows.length - 1].word;
  }
}

export async function updateGlosarium(payload: GlosariumUpdatePayload) {
  const pinCheck = checkSafetyPin(payload.pin)
  if (pinCheck.status === 'error') {
    return pinCheck
  }

  if (!payload.glosarium.length) {
    return {status: 'success', message: `Berhasil memperbaruhi 0 kata pada glosarium`}
  }

  const updateDate = payload.updateDate ? new Date(payload.updateDate) : new Date()
  const updatedHash = payload.glosarium.map((g) => ({
    word: g.word,
    hash: xxHash32(g.meaning, 0).toString(16)
  }))
  const BATCH_SIZE = 500

  await postgresDB.transaction(async (tx) => {
    for (let i = 0; i < payload.glosarium.length; i += BATCH_SIZE) {
      const glosariumBatch = payload.glosarium.slice(i, i + BATCH_SIZE);
      await tx.insert(glosariumTable)
        .values(glosariumBatch.map(b => ({...b, created_at: updateDate, updated_at: updateDate})))
        .onConflictDoUpdate({target: glosariumTable.word, set: {meaning: sql`excluded.meaning`, updated_at: updateDate}})

      const hashBatch = updatedHash.slice(i, i + BATCH_SIZE);
      await tx.insert(glosariumHashTable)
        .values(hashBatch)
        .onConflictDoUpdate({target: glosariumHashTable.word, set: {hash: sql`excluded.hash`}})
    }
    
    await tx.insert(glosariumMetadataTable)
      .values({key: GLOSARIUM_VERSION, value: updateDate.toISOString()})
      .onConflictDoUpdate({target: glosariumMetadataTable.key, set: {value: sql`excluded.value`}})
  })
  
  return {status: 'success', message: `Berhasil memperbaruhi ${payload.glosarium.length} kata pada glosarium`}
}