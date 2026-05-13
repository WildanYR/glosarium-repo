import { Hono } from "hono";
import { stream } from "hono/streaming";
import { checkSafetyPin, getAllHashes, getSyncStatus, updateGlosarium } from "../services/glosarium-update.service";
import { GlosariumUpdatePayload } from "../types/glosarium-update.type";

const glosariumUpdateRoute = new Hono()

glosariumUpdateRoute.post('/', async (c) => {
  const payload = await c.req.json() as GlosariumUpdatePayload

  const result = await updateGlosarium(payload)
  return c.json(result)
})

glosariumUpdateRoute.get('/sync-status', async (c) => {
  const syncStatus = await getSyncStatus()
  return c.json(syncStatus)
})

glosariumUpdateRoute.get('/hashes', (c) => {
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
    const hashes = getAllHashes();

    for await (const hash of hashes) {
      buffer += JSON.stringify(hash) + '\n';
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

glosariumUpdateRoute.post('/check-pin', async (c) => {
  const payload = await c.req.json() as {pin: string}
  return c.json(checkSafetyPin(payload.pin))
})

export default glosariumUpdateRoute