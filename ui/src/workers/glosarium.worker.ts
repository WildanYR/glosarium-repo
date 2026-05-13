import {expose} from 'comlink'
import {initSQLite, isIdbSupported} from '@subframe7536/sqlite-wasm'
import {useIdbStorage} from '@subframe7536/sqlite-wasm/idb'
import type {SQLiteDB} from '@subframe7536/sqlite-wasm';
import type { PaginationData } from '#/types/pagination.type';
import type { GlosariumData } from '#/types/glosarium.type';
import { apiGetGlosariumVersion } from '#/api/glosarium-updater.api';
import {read as XLSXRead, utils as XLSXUtils, } from 'xlsx'
import {xxHash32} from 'js-xxhash'

const pageLimit = 100
let db: SQLiteDB | null = null

const glosariumWorker = {
  async initDB(): Promise<{ status: string; message?: string}> {
    if (db) {
      return { status: 'success' }
    }

    if (!isIdbSupported()) {
      return { status: 'unsupported' }
    }

    try {
      db = await initSQLite(useIdbStorage('glosarium.db', {url: '/wa-sqlite-async.wasm'}))
      await db.run(`
        CREATE TABLE IF NOT EXISTS "glosarium" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "word" TEXT NOT NULL,
            "meaning" TEXT NOT NULL,
            "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
            "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "glosarium_word_unique" UNIQUE("word")
        );

        CREATE INDEX IF NOT EXISTS "idx_glosarium_word_nocase" 
        ON "glosarium" ("word" COLLATE NOCASE);

        CREATE VIRTUAL TABLE IF NOT EXISTS "glosarium_fts" USING fts5(
            "word",
            "meaning",
            content='glosarium',
            content_rowid='id'
        );

        CREATE TRIGGER IF NOT EXISTS "trg_glosarium_ai" 
        AFTER INSERT ON "glosarium" 
        BEGIN
            INSERT INTO "glosarium_fts" (rowid, "word", "meaning") 
            VALUES (new."id", new."word", new."meaning");
        END;

        CREATE TRIGGER IF NOT EXISTS "trg_glosarium_ad" 
        AFTER DELETE ON "glosarium" 
        BEGIN
            INSERT INTO "glosarium_fts" ("glosarium_fts", rowid, "word", "meaning") 
            VALUES ('delete', old."id", old."word", old."meaning");
        END;

        CREATE TRIGGER IF NOT EXISTS "trg_glosarium_au" 
        AFTER UPDATE ON "glosarium" 
        BEGIN
            -- Hapus data lama dari index FTS
            INSERT INTO "glosarium_fts" ("glosarium_fts", rowid, "word", "meaning") 
            VALUES ('delete', old."id", old."word", old."meaning");
            -- Masukkan data baru ke index FTS
            INSERT INTO "glosarium_fts" (rowid, "word", "meaning") 
            VALUES (new."id", new."word", new."meaning");
        END;

        CREATE TABLE IF NOT EXISTS "glosarium_hash" (
          "word" text PRIMARY KEY NOT NULL,
          "hash" text NOT NULL
        );

        CREATE TABLE IF NOT EXISTS "glosarium_metadata" (
          "key" text PRIMARY KEY NOT NULL,
          "value" text NOT NULL
        );
      `)

      return { status: 'success' }
    } catch(error) {
      const errorMessage = (error as Error).message
      console.error('init db error', errorMessage)
      return { status: 'error', message: errorMessage }
    }
  },
  
  async syncDatabase(origin:string, syncDate?: string) {
    if (!db) {
      return
    }

    const url = new URL('/api/glosarium/stream-all', origin)
    const params = new URLSearchParams()

    if (syncDate) {
      params.append('sync', syncDate)
    }

    url.search = params.toString()

    const glosariumRes = await fetch(url.toString())
    if (!glosariumRes.ok) throw new Error("Gagal sinkronisasi data glosarium terbaru");

    const reader = glosariumRes.body!.pipeThrough(new TextDecoderStream()).getReader();
    let partialLine = "";
    
    await db.run("BEGIN TRANSACTION;")
    try {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const lines = (partialLine + value).split('\n');
        partialLine = lines.pop() || '';
        
        const insertData: GlosariumData[] = []
        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine) {
            const data = JSON.parse(cleanLine) as GlosariumData;
            insertData.push(data)
          }
        }

        if (insertData.length) {
          const values: any = [];
          const placeholders = insertData.map(g => {
            values.push(
              g.id, 
              g.word, 
              g.meaning, 
              g.created_at || 'NULL',
              g.updated_at || 'NULL',
            );
            return "(?, ?, ?, ?, ?)";
          }).join(', ');

          await db.run(`
            INSERT INTO glosarium (id, word, meaning, created_at, updated_at) 
            VALUES ${placeholders}
            ON CONFLICT(id) 
            DO UPDATE SET meaning = excluded.meaning, updated_at = excluded.updated_at;
          `, values)
        }
      }

      // Masukkan data yang masih tersisa
      if (partialLine.trim()) {
        const insertData: GlosariumData[] = partialLine.split('\n')
          .filter(pl => !!pl)
          .map(pl => JSON.parse(pl))
        
        const values: any = [];
          const placeholders = insertData.map(g => {
            values.push(
              g.id, 
              g.word, 
              g.meaning, 
              g.created_at || 'NULL',
              g.updated_at || 'NULL',
            );
            return "(?, ?, ?, ?, ?)";
          }).join(', ');

          await db.run(`
            INSERT INTO glosarium (id, word, meaning, created_at, updated_at) 
            VALUES ${placeholders}
            ON CONFLICT(id) 
            DO UPDATE SET meaning = excluded.meaning, updated_at = excluded.updated_at;
          `, values)
      }

      await db.run('COMMIT;')
    } catch(error) {
      await db.run('ROLLBACK;')
      console.error("Gagal sinkronisasi data glosarium terbaru", error);
      throw error;
    }
  },
  
  async getGlosariumWithPagination(page: number, wordFilter?: string): Promise<PaginationData<GlosariumData>> {
    if (!db)
      throw new Error('DB not initialized')

    const offset = (page - 1) * pageLimit

    const conditions: string[] = []
    const params: string[] = []

    if (wordFilter) {
      conditions.push('word LIKE ?')
      params.push(`${wordFilter}%`)
    }

    const whereClause = conditions.length > 0
      ? ` WHERE ${conditions.join(' AND ')}`
      : ''

    const countSql = await db.run(`SELECT COUNT(*) as total FROM glosarium${whereClause};`, params)
    const totalCount = countSql[0].total as number

    const queryParams = [...params, pageLimit, offset]
    const rows = await db.run(`
      SELECT * FROM glosarium
      ${whereClause}
      LIMIT ? OFFSET ?
    `, queryParams) as unknown as GlosariumData[]

    const maxPage = Math.ceil(totalCount / pageLimit)

    return {
      items: rows.map(g => ({ ...g, created_at: g.created_at ? new Date(g.created_at) : undefined, updated_at: g.updated_at ? new Date(g.updated_at) : undefined })),
      pagination: {
        page,
        maxPage,
        totalItem: totalCount,
      },
    }
  },

  async getGlosariumMeaning(ids: number[]): Promise<{ items: GlosariumData[] }> {
    if (!db)
      throw new Error('DB not initialized')

    if (ids.length === 0) {
      return { items: [] }
    }

    const placeholders = ids.map(() => '?').join(',')
    const rows = await db.run(`SELECT * FROM glosarium WHERE id IN (${placeholders});`, ids) as unknown as GlosariumData[]

    const sortOrder: Record<number, number> = {}
    ids.forEach((id, index) => { sortOrder[id] = index })
    rows.sort((a, b) => sortOrder[a.id] - sortOrder[b.id])

    return { items: rows.map(g => ({ ...g, created_at: g.created_at ? new Date(g.created_at) : undefined, updated_at: g.updated_at ? new Date(g.updated_at) : undefined })) }
  },

  async searchGlosariumMeaning(page: number, wordFilter?: string): Promise<PaginationData<GlosariumData>> {
    if (!db)
      throw new Error('DB not initialized')

    if (!wordFilter) {
      return await this.getGlosariumWithPagination(page)
    }

    const offset = (page - 1) * pageLimit

    const countSql = await db.run(`
      SELECT COUNT(*) AS total
      FROM glosarium_fts
      WHERE glosarium_fts MATCH 'meaning:"' || ? || '"';
    `, [wordFilter])
    const totalCount = countSql[0].total as number

    const rows = await db.run(`
      SELECT 
        g.id AS id, 
        g.word AS word, 
        g.meaning AS meaning, 
        g.created_at AS created_at, 
        g.updated_at AS updated_at
      FROM glosarium g
      JOIN glosarium_fts f ON g.id = f.rowid
      WHERE f.glosarium_fts MATCH 'meaning:"' || ? || '"'
      ORDER BY bm25(glosarium_fts)
      LIMIT ? OFFSET ?;
    `, [wordFilter, pageLimit, offset]) as unknown as GlosariumData[]

    const maxPage = Math.ceil(totalCount / pageLimit)

    return {
      items: rows,
      pagination: {
        page,
        maxPage,
        totalItem: totalCount,
      },
    }
  },

  async updateGlosariumWithExcel(origin: string, fileBuffer: ArrayBuffer, pin: string, callback: (message: string, progress: number) => void, updateDate?: string): Promise<{message: string; stats: {total: number; changed: number}}> {
    // TODO ubah implementasi indexedDB dengan sqlite, updater hanya bisa jalan untuk user yang support sqlite
    if (!db) {
      throw new Error('Browser tidak mendukung database lokal (IndexedDB)')
    }
    
    let currentProgress = 5
    // 1. CEK STATUS SINKRONISASI SERVER
    callback('Cek versi glosarium dari server...', currentProgress)
    let serverVersion = 'initial'
    try {
      const verRes = await apiGetGlosariumVersion(origin)
      serverVersion = verRes.version
    } catch(error) {
      console.error(error)
      throw new Error('Gagal mengambil versi glosarium dari server')
    }
    currentProgress = 10

    // 2. SINKRONISASI HASH JIKA VERSI BERBEDA (Menggunakan NDJSON Stream)
    const versionRows = await db.run(`SELECT * FROM glosarium_metadata WHERE key = ?;`, ['hash_version'])
    const localVersion = versionRows.length ? versionRows[0].value : 'initial';

    if (serverVersion !== localVersion) {
      callback('Mendownload hash terbaru...', currentProgress);
      
      const hashRes = await fetch('/api/glosarium/update/hashes');
      if (!hashRes.ok) throw new Error("Gagal mengambil data hash dari server");

      const reader = hashRes.body!.pipeThrough(new TextDecoderStream()).getReader();
      let partialLine = "";
      
      await db.run("BEGIN TRANSACTION;")
      try {
        await db.run('DELETE FROM glosarium_hash;')
        let maxHashProgress = false
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          
          const lines = (partialLine + value).split('\n');
          partialLine = lines.pop() || '';
          
          const insertData: { word: string; hash: string; }[] = []
          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine) {
              const data = JSON.parse(cleanLine) as { word: string; hash: string; };
              insertData.push(data)
            }
          }

          if (insertData.length) {
            const values: any = [];
            const placeholders = insertData.map(d => {
              values.push(d.word, d.hash);
              return "(?, ?)";
            }).join(', ');

            await db.run(`
              INSERT INTO glosarium_hash (word, hash) 
              VALUES ${placeholders}
              ON CONFLICT(word) 
              DO NOTHING;
            `, values)
          }

          if (currentProgress < 40) {
            currentProgress += 1;
            callback('Sinkronisasi database lokal...', Math.floor(currentProgress));
            await new Promise(r => setTimeout(r, 0));
          } else {
            if (!maxHashProgress) {
              callback('Proses masih berjalan, mohon tunggu...', 40);
              maxHashProgress = true
            }
          }
        }

        // Masukkan data yang masih tersisa
        if (partialLine.trim()) {
          const insertData: { word: string; hash: string; }[] = partialLine.split('\n')
            .filter(pl => !!pl)
            .map(pl => JSON.parse(pl))
          
          const values: any = [];
          const placeholders = insertData.map(d => {
            values.push(d.word, d.hash);
            return "(?, ?)";
          }).join(', ');

          await db.run(`
            INSERT INTO glosarium_hash (word, hash) 
            VALUES ${placeholders}
            ON CONFLICT(word) 
            DO NOTHING;
          `, values)
        }

        await db.run(`
          INSERT INTO glosarium_metadata (key, value) 
          VALUES (?, ?) 
          ON CONFLICT(key) 
          DO UPDATE SET value = excluded.value;
        `, ['hash_version', serverVersion])

        await db.run('COMMIT;')
      } catch(error) {
        await db.run('ROLLBACK;')
        console.error("Gagal sinkronisasi hash:", error);
        throw error;
      }
    }

    currentProgress = 40;
    // 3. BACA FILE EXCEL
    callback('Membaca file Excel...', 40)
    const workbook = XLSXRead(fileBuffer, {type: 'array'})
    const mergedData = new Map()
    const totalSheets = workbook.SheetNames.length;

    workbook.SheetNames.forEach((sheetName, index) => {
      const worksheet = workbook.Sheets[sheetName]
      const sheetData = XLSXUtils.sheet_to_json<{
        KATA?: string | number;
        'ARTI KATA'?: string | number;
      }>(worksheet)

      for (const row of sheetData) {
        const word = row['KATA']?.toString().trim()
        const meaning = row['ARTI KATA']?.toString().trim()

        if (!word) continue;

        if (!mergedData.has(word)) {
          if (!meaning) continue;
          mergedData.set(word, meaning)
        } else {
          if (!meaning) continue;
          const existingMeaning = mergedData.get(word);
          // Jika arti kata berbeda
          if (existingMeaning !== meaning) {
            // Cek apakah salah satunya merupakan bagian dari yang lain (lebih lengkap)
            if (existingMeaning.includes(meaning)) {
              // existing sudah lebih lengkap, biarkan
            } else if (meaning.includes(existingMeaning)) {
              // meaning baru lebih lengkap, timpa
              mergedData.set(word, meaning);
            } else {
              // Benar-benar berbeda, gabungkan
              mergedData.set(word, `${existingMeaning}; ${meaning}`);
            }
          }
        }
      }

      const incremental = ((index + 1) / totalSheets) * 20;
      callback(`Memproses sheet: ${sheetName}`, Math.floor(40 + incremental));
    })

    currentProgress = 60
    // 4. PROSES DIFFING (Menggunakan data yang sudah di-merge)
    callback('Memeriksa perubahan data...', currentProgress)
    const payloadToUpdate: {word: string; meaning: string}[] = []
    const entries = Array.from(mergedData.entries());
    const totalEntries = entries.length;

    for (let i = 0; i < totalEntries; i++) {
      const [word, meaning] = entries[i];
      if (!meaning) continue;

      const newHash = xxHash32(meaning, 0).toString(16)

      const rows = await db.run(`
        SELECT * FROM glosarium_hash
        WHERE word = ?
        LIMIT 1
      `, [word]) as unknown as {word: string; hash: string}[]
      const cachedData = rows.length ? rows[0] : null

      if (!cachedData || cachedData.hash !== newHash) {
        payloadToUpdate.push({ word, meaning })
      }

      if (i % 100 === 0 || i === totalEntries - 1) {
        const incremental = ((i + 1) / totalEntries) * 20;
        currentProgress = 60 + incremental;
        callback('Memeriksa perubahan data...', Math.floor(currentProgress));
        await new Promise(r => setTimeout(r, 0));
      }
    }

    if (payloadToUpdate.length === 0) {
      return {message: 'Data sudah yang terbaru!', stats: {total: mergedData.size, changed: 0}}
    }

    currentProgress = 85;
    callback('Memperbaruhi database Glosarium...', currentProgress)

    const updateRes = await fetch('/api/glosarium/update', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        updateDate: updateDate || undefined,
        pin,
        glosarium: payloadToUpdate
      })
    })
    if (!updateRes.ok) throw new Error('Gagal memperbaruhi data ke server');

    const updateResData = await updateRes.json()
    if (updateResData.status === 'error') {
      throw new Error(updateResData.message)
    }

    return {message: 'Glosarium berhasil diperbaruhi!', stats: {total: mergedData.size, changed: payloadToUpdate.length}}
  }
}

expose(glosariumWorker)
export type GlosariumWorker = typeof glosariumWorker