import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { gzipSync } from "node:zlib";

const requestedDirectory = process.argv[2];

const assetDirectory = requestedDirectory
  ? join(process.cwd(), requestedDirectory)
  : join(process.cwd(), ".output", "public", "assets");

const limit = 500_000;

if (!existsSync(assetDirectory)) {
  console.error(
    `Bundle budget failed: ${assetDirectory} does not exist. Run the production build first.`,
  );
  process.exit(1);
}

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

const shellPath = join(dirname(assetDirectory), "_shell.html");

if (existsSync(shellPath)) {
  const shell = readFileSync(shellPath, "utf8");

  const initial = [
    ...new Set([...shell.matchAll(/\/assets\/([^"']+?\.js)/g)].map((match) => match[1])),
  ];

  const deferred = initial.filter((file) => /^(?:three|gsap)/.test(file));

  if (deferred.length > 0) {
    console.error(
      `\nBundle budget failed: the initial shell references deferred vendor chunks: ${deferred.join(", ")}`,
    );
    process.exit(1);
  }

  const initialBytes = initial.reduce(
    (total, file) => total + statSync(join(assetDirectory, file)).size,
    0,
  );

  const initialGzip = initial.reduce(
    (total, file) => total + gzipSync(readFileSync(join(assetDirectory, file))).byteLength,
    0,
  );

  console.log(
    `\nInitial shell: ${initial.length} JavaScript preloads, ${(initialBytes / 1000).toFixed(1)} kB min / ${(initialGzip / 1000).toFixed(1)} kB gzip, no Three.js or GSAP.`,
  );
}

console.log(`Bundle budget: OK (${bundles.length} client chunks, every chunk <= 500 kB minified)`);
