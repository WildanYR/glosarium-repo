import { $ } from "bun";
import { rm, mkdir } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const distDir = join(root, "dist");
const uiDir = join(root, "ui");
const apiDir = join(root, "api");

async function build() {
  console.log("🚀 Memulai proses build...");

  // 1. Bersihkan folder dist
  console.log("🧹 Membersihkan folder dist...");
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  // 2. Build UI
  // ui/vite.config.ts sudah dikonfigurasi untuk output ke ../dist/public
  console.log("📦 Membangun UI (Vite)...");
  await $`cd ${uiDir} && bun install && bun run build`;

  // 3. Build API
  // Bundling API ke dist/index.js
  console.log("backend Membangun API (Bun)...");
  await $`cd ${apiDir} && bun install && bun build ./src/index.ts --outfile ../dist/index.js --target bun --minify`;

  console.log("\n✅ Build selesai!");
  console.log("-------------------");
  console.log(`Hasil build:`);
  console.log(`- API: dist/index.js`);
  console.log(`- UI:  dist/public/`);
  console.log("");
  console.log(`Cara menjalankan:`);
  console.log(`  cd dist && bun index.js`);
  console.log("-------------------");
}

build().catch((err) => {
  console.error("\n❌ Build gagal:");
  console.error(err);
  process.exit(1);
});
