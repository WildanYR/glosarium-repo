import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/bun';
import { getCookie, setCookie } from 'hono/cookie';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';

import { PORT, SECURE_ENV } from './configs/app.config';
import { GLOSARIUM_APP_DIR } from './configs/path.config';
import glosariumGetRoute from './routes/glosarium-get.route';
import glosariumUpdateRoute from './routes/glosarium-update.route';

// --- Konfigurasi Versi PWA ---
const CURRENT_PWA_VERSION = '2'; 

const app = new Hono();

// --- 1. Middleware Global (Common) ---
app.use('*', cors());

// --- 2. Middleware Keamanan Khusus (WASM Isolation) ---
app.use('/*', async (c, next) => {
  const path = c.req.path;
  await next();
  if (path.endsWith('.wasm')) {
    c.header('Content-Type', 'application/wasm');
  }
});

// --- 3. Middleware Versioning & Migrasi PWA ---
app.use('*', async (c, next) => {
  const path = c.req.path;
  
  const isApi = path.startsWith('/api');
  const isStaticAsset = path.includes('.') && !path.endsWith('.html');

  if (!isApi && !isStaticAsset) {
    const clientVersion = getCookie(c, 'pwa_version');

    if (clientVersion !== CURRENT_PWA_VERSION) {
      c.header('Clear-Site-Data', '"storage", "cache", "executionContexts"');
    }

    setCookie(c, 'pwa_version', CURRENT_PWA_VERSION, {
      maxAge: 31536000,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure: SECURE_ENV
    });
  }

  await next();
});

// --- 4. API Routes ---
app.route('/api/glosarium/update', glosariumUpdateRoute);
app.route('/api/glosarium', glosariumGetRoute);

// --- 5. Static Files (Glosarium App / Root) ---
app.use('/*', serveStatic({ root: GLOSARIUM_APP_DIR }));

// --- 6. SPA Fallback (HTML Support) ---
app.get('*', async (c) => {
  const path = c.req.path;
  
  if (path.includes('.') && !path.endsWith('.html')) {
    return c.notFound();
  }

  try {
    const html = await readFile(join(GLOSARIUM_APP_DIR, 'index.html'), 'utf-8');
    return c.html(html);
  } catch (e) {
    return c.notFound();
  }
});

export default {
  port: PORT,
  fetch: app.fetch
};