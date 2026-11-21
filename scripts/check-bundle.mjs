import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const assetDirectory = join(process.cwd(), ".output", "public", "assets");
const limit = 500_000;

const bundles = readdirSync(assetDirectory)
  .filter((file) => file.endsWith(".js"))
  .map((file) => {
    const path = join(assetDirectory, file);
    const bytes = statSync(path).size;
    const gzip = gzipSync(readFileSync(path)).byteLength;

    return { file, bytes, gzip };
  })
  .toSorted((left, right) => right.bytes - left.bytes);

for (const bundle of bundles) {
  const minified = (bundle.bytes / 1000).toFixed(1).padStart(7);
  const compressed = (bundle.gzip / 1000).toFixed(1).padStart(6);

  console.log(`${bundle.file.padEnd(52)} ${minified} kB min ${compressed} kB gzip`);
}

const oversized = bundles.filter((bundle) => bundle.bytes > limit);

if (oversized.length > 0) {
  console.error(`\nBundle budget failed: ${oversized.length} chunk(s) exceed 500 kB:`);

  for (const bundle of oversized) {
    console.error(`- ${bundle.file}: ${(bundle.bytes / 1000).toFixed(1)} kB`);
  }

  process.exit(1);
}

console.log(
  `\nBundle budget: OK (${bundles.length} client chunks, every chunk <= 500 kB minified)`,
);
