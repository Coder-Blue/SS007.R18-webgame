import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const routeSource = readFileSync(
  fileURLToPath(new URL("../routes/og.png.ts", import.meta.url)),
  "utf8",
);

const fontDirectory = fileURLToPath(new URL("../public/fonts", import.meta.url));

const capture = (match: RegExpMatchArray, index: number): string => {
  const value = match[index];

  if (value === undefined) {
    throw new Error(`Missing capture ${index} in ${match[0]}`);
  }

  return value;
};

const usedWeights = [
  ...new Set(
    [...routeSource.matchAll(/\bfontWeight:\s*(\d+)\b/g)].map((match) => Number(capture(match, 1))),
  ),
].toSorted((left, right) => left - right);

const registrations = [
  ...routeSource.matchAll(/\bfont\(\s*origin\s*,\s*"([^"]+)"\s*,\s*(\d+)\s*\)/g),
].map((match) => ({ file: capture(match, 1), weight: Number(capture(match, 2)) }));

const registeredWeights = new Set(registrations.map((entry) => entry.weight));
const registeredFiles = new Set(registrations.map((entry) => entry.file));

describe("Open Graph font manifest", () => {
  test("registers every weight used by the card", () => {
    expect(usedWeights.length).toBeGreaterThan(0);
    expect(registrations.length).toBeGreaterThan(0);

    for (const weight of usedWeights) {
      expect(registeredWeights.has(weight), `weight ${weight} is registered`).toBe(true);
      expect(
        registeredFiles.has(`be-vietnam-pro-${weight}-latin.woff2`),
        `weight ${weight} has a Latin face`,
      ).toBe(true);
      expect(
        registeredFiles.has(`be-vietnam-pro-${weight}-vietnamese.woff2`),
        `weight ${weight} has a Vietnamese face`,
      ).toBe(true);
    }
  });

  test("references only existing WOFF2 files", () => {
    for (const entry of registrations) {
      expect(entry.file, "uses a WOFF2 filename").toMatch(
        /^be-vietnam-pro-\d+-(latin|vietnamese)\.woff2$/,
      );
      expect(existsSync(`${fontDirectory}/${entry.file}`), `${entry.file} exists`).toBe(true);
    }
  });
});
