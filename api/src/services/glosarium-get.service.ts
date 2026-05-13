import { and, count, gt, inArray, like, sql } from "drizzle-orm"
import { glosariumTable } from "../databases/schemas/postgres.schema"
import { postgresDB } from "../databases/postgres-db"

const pageLimit = 100

export async function getGlosariumWithPagination(page: number, wordFilter?: string, syncDate?: Date) {
  const offset = (page - 1) * pageLimit
  const condition = []

  if (wordFilter) {
    condition.push(like(glosariumTable.word, `${wordFilter}%`))
  }

  if (syncDate) {
    condition.push(gt(glosariumTable.updated_at, syncDate))
  }

  const whereClause = condition.length > 0 ? and(...condition) : undefined

  const [totalCount] = await postgresDB.select({ count: count() }).from(glosariumTable).where(whereClause)
  const rows = await postgresDB.select().from(glosariumTable).where(whereClause).limit(pageLimit).offset(offset).orderBy(glosariumTable.word)

  const maxPage = Math.ceil(totalCount.count / pageLimit)
  return {
    items: rows,
    pagination: {
      page,
      maxPage,
      totalItem: totalCount.count,
    },
  }
}

export async function getGlosariumMeaning(ids: number[]) {
  if (ids.length === 0)
    return { items: [] }

  const rows = await postgresDB.select().from(glosariumTable).where(inArray(glosariumTable.id, ids))

  const sortOrder: Record<number, number> = {}
  ids.forEach((id, index) => {
    sortOrder[id] = index
  })

  rows.sort((a, b) => sortOrder[a.id] - sortOrder[b.id])

  return { items: rows }
}

export async function searchGlosariumMeaning(page: number, wordFilter?: string) {
  if (!wordFilter) {
    return await getGlosariumWithPagination(page)
  }

  const offset = (page - 1) * pageLimit

  const [totalCount] = await postgresDB.select({ count: count() }).from(glosariumTable)
  const rows = await postgresDB
    .select()
    .from(glosariumTable)
    .where(sql`${glosariumTable.meaning_vector} @@ plainto_tsquery('simple', ${wordFilter})`)
    .orderBy(sql`ts_rank(${glosariumTable.meaning_vector}, plainto_tsquery('simple', ${wordFilter})) DESC`)
    .limit(pageLimit)
    .offset(offset)

  const maxPage = Math.ceil(totalCount.count / pageLimit)
  return {
    items: rows,
    pagination: {
      page,
      maxPage,
      totalItem: totalCount.count,
    },
  }
}

export async function* getAllGlosariumStream(syncDate?: Date) {
  const chunkSize = 500;
  let lastWord: string | null = null; 
  let hasMore = true;

  while (hasMore) {
    const conditions = [];

    if (syncDate) {
      conditions.push(gt(glosariumTable.updated_at, syncDate));
    }

    if (lastWord) {
      conditions.push(gt(glosariumTable.word, lastWord));
    }

    const whereClause: any = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await postgresDB
      .select()
      .from(glosariumTable)
      .where(whereClause)
      .orderBy(glosariumTable.word)
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