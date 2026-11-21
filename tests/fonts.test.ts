import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const readSource = (relativePath: string): string =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");

const routeSource = readSource("../routes/og.png.ts");
const cssSource = readSource("../src/styles/fonts.css");
const rootSource = readSource("../src/routes/__root.tsx");
const nitroSource = readSource("../nitro.config.ts");
const vercelSource = readSource("../vercel.json");
const fontDirectory = fileURLToPath(new URL("../public/fonts", import.meta.url));

const faces = [
  { weight: 400, ttf: "be-vietnam-pro-regular.ttf" },
  { weight: 500, ttf: "be-vietnam-pro-medium.ttf" },
  { weight: 600, ttf: "be-vietnam-pro-semibold.ttf" },
  { weight: 700, ttf: "be-vietnam-pro-bold.ttf" },
  { weight: 800, ttf: "be-vietnam-pro-extrabold.ttf" },
] as const;

const woff2File = (weight: number, subset: "latin" | "vietnamese"): string =>
  `be-vietnam-pro-${weight}-${subset}.woff2`;

const woff2Files = faces.flatMap((face) => [
  woff2File(face.weight, "vietnamese"),
  woff2File(face.weight, "latin"),
]);

const criticalPreloads = [
  "be-vietnam-pro-400-vietnamese.woff2",
  "be-vietnam-pro-400-latin.woff2",
  "be-vietnam-pro-600-vietnamese.woff2",
  "be-vietnam-pro-600-latin.woff2",
  "be-vietnam-pro-700-vietnamese.woff2",
  "be-vietnam-pro-700-latin.woff2",
  "be-vietnam-pro-800-vietnamese.woff2",
  "be-vietnam-pro-800-latin.woff2",
];

const vietnameseRange =
  "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, " +
  "U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB";

const latinRange =
  "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, " +
  "U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";

const tableOffset = (data: Buffer, tag: string): number => {
  const tableCount = data.readUInt16BE(4);

  for (let index = 0; index < tableCount; index += 1) {
    const record = 12 + index * 16;

    if (data.toString("ascii", record, record + 4) === tag) {
      return data.readUInt32BE(record + 8);
    }
  }

  throw new Error(`Missing ${tag} table`);
};

const readTtfWeight = (file: string): number => {
  const data = readFileSync(`${fontDirectory}/${file}`);

  expect(data.subarray(0, 4), `${file} has a TrueType signature`).toEqual(
    Buffer.from([0x00, 0x01, 0x00, 0x00]),
  );

  return data.readUInt16BE(tableOffset(data, "OS/2") + 4);
};

const readWoff2 = (file: string): void => {
  const data = readFileSync(`${fontDirectory}/${file}`);

  expect(data.subarray(0, 4), `${file} has a WOFF2 signature`).toEqual(
    Buffer.from([0x77, 0x4f, 0x46, 0x32]),
  );
  expect(data.readUInt32BE(4), `${file} is TrueType flavored`).toBe(0x00010000);
  expect(data.readUInt32BE(8), `${file} length header matches file size`).toBe(data.byteLength);
};

const readCmap = (data: Buffer): ReadonlySet<number> => {
  const cmap = tableOffset(data, "cmap");
  const subtableCount = data.readUInt16BE(cmap + 2);
  let subtable = -1;

  for (let index = 0; index < subtableCount; index += 1) {
    const record = cmap + 4 + index * 8;
    const offset = cmap + data.readUInt32BE(record + 4);

    if (
      data.readUInt16BE(record) === 3 &&
      data.readUInt16BE(record + 2) === 1 &&
      data.readUInt16BE(offset) === 4
    ) {
      subtable = offset;
    }
  }

  if (subtable < 0) throw new Error("Missing Windows Unicode cmap");

  const segmentCount = data.readUInt16BE(subtable + 6) / 2;
  const endCodes = subtable + 14;
  const startCodes = endCodes + segmentCount * 2 + 2;
  const deltas = startCodes + segmentCount * 2;
  const rangeOffsets = deltas + segmentCount * 2;
  const covered = new Set<number>();

  for (let segment = 0; segment < segmentCount; segment += 1) {
    const end = data.readUInt16BE(endCodes + segment * 2);
    const start = data.readUInt16BE(startCodes + segment * 2);
    const delta = data.readInt16BE(deltas + segment * 2);
    const rangeOffset = data.readUInt16BE(rangeOffsets + segment * 2);

    for (let code = start; code <= end && code !== 0xffff; code += 1) {
      let glyph = 0;

      if (rangeOffset === 0) {
        glyph = (code + delta) & 0xffff;
      } else {
        const position = rangeOffsets + segment * 2 + rangeOffset + (code - start) * 2;
        glyph = data.readUInt16BE(position);

        if (glyph !== 0) glyph = (glyph + delta) & 0xffff;
      }

      if (glyph !== 0) covered.add(code);
    }
  }

  return covered;
};

const vietnameseCodepoints = [
  0x0102, 0x0103, 0x0110, 0x0111, 0x0128, 0x0129, 0x0168, 0x0169, 0x01a0, 0x01a1, 0x01af, 0x01b0,
  0x0300, 0x0301, 0x0302, 0x0303, 0x0304, 0x0306, 0x0307, 0x0308, 0x0309, 0x030a, 0x030b, 0x030c,
  0x0312, 0x031b, 0x0323, 0x0326, 0x0327, 0x0328, 0x1ea0, 0x1ea1, 0x1ef9, 0x20ab,
];

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

const cssFaces = [...cssSource.matchAll(/@font-face\s*\{([\s\S]*?)\}/g)].map((match) => {
  const block = capture(match, 1);
  const weight = /font-weight:\s*(\d+);/.exec(block);
  const file = /url\("([^"]+)"\)/.exec(block);
  const range = /unicode-range:\s*([^;]+);/.exec(block);

  if (weight === null || file === null || range === null) {
    throw new Error(`Incomplete @font-face block: ${block}`);
  }

  return {
    weight: Number(capture(weight, 1)),
    file: capture(file, 1),
    range: capture(range, 1).replace(/\s+/g, " ").trim(),
  };
});

const fontFiles = readdirSync(fontDirectory).filter((entry) =>
  /\.(?:ttf|otf|woff2?)$/i.test(entry),
);

describe("local font manifest", () => {
  test("registers every weight used by the OG card", () => {
    expect(usedWeights.length).toBeGreaterThan(0);
    expect(registrations.length).toBeGreaterThan(0);

    for (const weight of usedWeights) {
      expect(registeredWeights.has(weight), `weight ${weight} is registered`).toBe(true);
    }

    const fileByWeight = new Map(registrations.map((entry) => [entry.weight, entry.file]));

    for (const face of faces) {
      if (registeredWeights.has(face.weight)) {
        expect(fileByWeight.get(face.weight), `weight ${face.weight} uses the right file`).toBe(
          face.ttf,
        );
      }
    }
  });

  test("references only existing TTF files from the OG route", () => {
    for (const entry of registrations) {
      expect(entry.file, "uses a TTF filename").toMatch(/^be-vietnam-pro-[a-z]+\.ttf$/);
      expect(existsSync(`${fontDirectory}/${entry.file}`), `${entry.file} exists`).toBe(true);
    }
  });

  test("ships five TTF OG faces and ten WOFF2 UI faces", () => {
    expect(fontFiles.filter((file) => file.endsWith(".ttf")).toSorted()).toEqual(
      faces.map((face) => face.ttf).toSorted(),
    );
    expect(fontFiles.filter((file) => file.endsWith(".woff2")).toSorted()).toEqual(
      woff2Files.toSorted(),
    );
    expect(fontFiles).toHaveLength(faces.length + woff2Files.length);
  });

  test("every TTF is valid and declares the expected weight", () => {
    for (const face of faces) {
      expect(readTtfWeight(face.ttf), `${face.ttf} declares weight ${face.weight}`).toBe(
        face.weight,
      );
    }
  });

  test("every WOFF2 pair carries the WOFF2 magic bytes", () => {
    for (const file of woff2Files) {
      expect(() => readWoff2(file), `${file} is a valid WOFF2 file`).not.toThrow();
    }
  });

  test("every TTF covers the Vietnamese diacritics used by the OG image", () => {
    for (const face of faces) {
      const covered = readCmap(readFileSync(`${fontDirectory}/${face.ttf}`));

      for (const codepoint of vietnameseCodepoints) {
        expect(covered.has(codepoint), `${face.ttf} covers U+${codepoint.toString(16)}`).toBe(true);
      }
    }
  });

  test("declares ten WOFF2 faces with the exact latin and vietnamese ranges", () => {
    expect(cssSource).not.toMatch(/format\("truetype"\)/);
    expect(cssFaces).toEqual(
      faces.flatMap((face) => [
        {
          weight: face.weight,
          file: `/fonts/${woff2File(face.weight, "vietnamese")}`,
          range: vietnameseRange,
        },
        {
          weight: face.weight,
          file: `/fonts/${woff2File(face.weight, "latin")}`,
          range: latinRange,
        },
      ]),
    );
  });

  test("preloads only the critical WOFF2 subsets used by the title screen", () => {
    expect(rootSource).not.toContain(".ttf");

    for (const file of criticalPreloads) {
      expect(rootSource).toContain(`/fonts/${file}`);
    }

    expect(rootSource.match(/type: "font\/woff2"/g)).toHaveLength(criticalPreloads.length);
  });

  test("bundles TTF OG fonts and caches public font assets for thirty days", () => {
    expect(routeSource).not.toMatch(/woff2?/);
    expect(routeSource).toContain('font(origin, "be-vietnam-pro-regular.ttf", 400)');
    expect(routeSource).toContain('font(origin, "be-vietnam-pro-semibold.ttf", 600)');
    expect(routeSource).toContain('font(origin, "be-vietnam-pro-bold.ttf", 700)');
    expect(routeSource).toContain('font(origin, "be-vietnam-pro-extrabold.ttf", 800)');
    expect(nitroSource).toContain('baseName: "fonts"');
    expect(nitroSource).toContain('dir: "./public/fonts"');
    expect(nitroSource).toContain('"/fonts/**"');
    expect(nitroSource).toContain("public, max-age=2592000");
    expect(vercelSource).toContain('"source": "/fonts/(.*)"');
    expect(vercelSource).toContain('"key": "Cache-Control"');
    expect(vercelSource).toContain("public, max-age=2592000");
  });
});
