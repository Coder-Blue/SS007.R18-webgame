import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["src", "tests", "scripts"];
const extensions = new Set([".ts", ".tsx", ".css", ".json"]);
const generated = new Set(["routeTree.gen.ts"]);
const violations = [];
const walk = (directory) => {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path);
      continue;
    }
    const extension = path.slice(path.lastIndexOf("."));
    if (!extensions.has(extension)) continue;
    if (generated.has(entry)) continue;
    const lines = readFileSync(path, "utf8").split("\n").length;
    if (lines > 500) violations.push(`${path}: ${lines} lines`);
  }
};
for (const root of roots) walk(root);
if (violations.length > 0) {
  console.error("Files over 500 lines:");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}
console.log("Line budget: OK (all source files <= 500 lines)");
