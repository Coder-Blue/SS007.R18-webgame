import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const forbidden = [
  /from ['"]three/,
  /from ['"]solid-js/,
  /from ['"]@solidjs/,
  /from ['"]@tanstack/,
  /from ['"].*ui\//,
  /from ['"].*scene\//,
  /from ['"].*state\//,
  /\bwindow\./,
  /\bdocument\./,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
];
const files = [];
const walk = (directory) => {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (path.endsWith(".ts") || path.endsWith(".tsx")) files.push(path);
  }
};
walk("src/domain");
const violations = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const pattern of forbidden) {
    if (pattern.test(text)) violations.push(`${file}: ${pattern}`);
  }
}
if (violations.length > 0) {
  console.error("Domain boundary violations:");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}
console.log(`Domain boundary: OK (${files.length} pure files)`);
