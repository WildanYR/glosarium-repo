import { Hono } from "hono";
import { getAllGlosariumStream, getGlosariumMeaning, getGlosariumWithPagination, searchGlosariumMeaning } from "../services/glosarium-get.service";
import { stream } from "hono/streaming";

const glosariumGetRoute = new Hono()

glosariumGetRoute.get('/', async (c) => {
  const page = c.req.query('page')
  const wordFilter = c.req.query('word')
  const sync = c.req.query('sync')

  const result = await getGlosariumWithPagination(page ? Number.parseInt(page) : 1, wordFilter, sync ? new Date(sync) : undefined)
  return c.json(result)
})

glosariumGetRoute.get('/meaning', async (c) => {
  const idQuery = c.req.query('ids')

  const ids: number[] = []

  if (idQuery) {
    idQuery.split(',').forEach((id) => {
      ids.push(Number.parseInt(id))
    })
  }

  const result = await getGlosariumMeaning(ids)

  return c.json(result)
})

glosariumGetRoute.get('/meaning-search', async (c) => {
  const page = c.req.query('page')
  const wordFilter = c.req.query('word')

  const result = await searchGlosariumMeaning(page ? Number.parseInt(page) : 1, wordFilter)

  return c.json(result)
})

glosariumGetRoute.get('/stream-all', (c) => {
  const lastSyncQuery = c.req.query('sync');
  let syncDate: Date | undefined = undefined;

  if (lastSyncQuery) {
    const parsedDate = new Date(lastSyncQuery);
    if (!isNaN(parsedDate.getTime())) {
      syncDate = parsedDate;
    }
  }
  
  // Streaming Header
  c.header('Content-Type', 'application/x-ndjson');
  c.header('Transfer-Encoding', 'chunked');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Cache-Control', 'no-cache, no-transform');
  c.header('X-Accel-Buffering', 'no');
  c.header('Connection', 'keep-alive');
  
  return stream(c, async (stream) => {
    let buffer = "";
    let count = 0;
    
    const glosariumData = getAllGlosariumStream(syncDate);

    for await (const row of glosariumData) {
      buffer += JSON.stringify(row) + '\n';
      count++;

      if (count >= 500) {
        await stream.write(buffer);
        buffer = "";
        count = 0;
      }
    }

    if (buffer) {
      await stream.write(buffer);
    }
  });
});

export default glosariumGetRoute