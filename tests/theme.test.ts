import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const stylesDir = join(process.cwd(), "src/styles");

const styleSources = readdirSync(stylesDir)
  .filter((file) => file.endsWith(".css"))
  .map((file) => ({ file, source: readFileSync(join(stylesDir, file), "utf8") }));

describe("theme colors", () => {
  test("uses oklch instead of hex or rgba colors", () => {
    for (const { file, source } of styleSources) {
      expect(source, file).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      expect(source, file).not.toMatch(/rgba?\(/i);
    }
  });

  test("exposes the semantic Tailwind color tokens", () => {
    const tokens = styleSources.find(({ file }) => file === "tokens.css")?.source ?? "";

    for (const token of [
      "--color-bg",
      "--color-panel",
      "--color-panel-2",
      "--color-line",
      "--color-ink",
      "--color-electric",
      "--color-amber",
      "--color-gold",
      "--color-green",
    ]) {
      expect(tokens).toContain(`${token}:`);
    }
  });
});
