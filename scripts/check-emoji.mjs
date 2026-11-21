import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["src", "tests", "scripts", "routes", "docs", "public", ".github"];
const skip = new Set(["node_modules", ".output", ".git", "coverage", "test-results", "fonts"]);
const emoji = /(?:[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]|\u{FE0F})/u;
const files = [];

const walk = (directory) => {
  for (const entry of readdirSync(directory)) {
    if (skip.has(entry)) continue;
    const path = join(directory, entry);

    if (statSync(path).isDirectory()) {
      walk(path);
      continue;
    }

    if (/\.(woff2|png|jpg|jpeg|ico|gz|lock)$/.test(entry)) continue;
    files.push(path);
  }
};

for (const root of roots) walk(root);

for (const file of readdirSync(".").filter((entry) => entry.endsWith(".md"))) {
  try {
    readFileSync(file, "utf8");
    files.push(file);
  } catch {
    // optional file
  }
}

const violations = [];

for (const file of files) {
  let text;

  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  if (emoji.test(text)) violations.push(file);
}

if (violations.length > 0) {
  console.error("Emoji-like characters found:");

  for (const file of violations) console.error(`- ${file}`);
  process.exit(1);
}

console.log(`Emoji audit: OK (${files.length} text files scanned)`);
