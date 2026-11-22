import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { defineHandler } from "nitro";
import { useStorage } from "nitro/storage";
import { container, text } from "takumi-js/helpers";
import ImageResponse from "takumi-js/response";
import wasmUrl from "takumi-js/wasm-url";

const WIDTH = 1200;
const HEIGHT = 630;
const fontCache = new Map<string, Promise<Uint8Array>>();

const normalizeFont = (value: Uint8Array | ArrayBuffer): Uint8Array =>
  value instanceof Uint8Array ? value : new Uint8Array(value);

const fetchFont = async (origin: string, file: string): Promise<Uint8Array> => {
  const response = await fetch(`${origin}/fonts/${file}`);

  if (!response.ok) {
    throw new Error(`Font request failed for ${file}: HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.startsWith("font/")) {
    throw new Error(`Font request for ${file} returned ${contentType}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());

  if (bytes.byteLength < 1_000) {
    throw new Error(`Font request for ${file} returned ${bytes.byteLength} bytes`);
  }

  return bytes;
};

const loadFont = (origin: string, file: string): Promise<Uint8Array> => {
  const cached = fontCache.get(file);

  if (cached !== undefined) return cached;

  const pending = (async () => {
    try {
      const bundled = await useStorage("assets:fonts").getItemRaw<Uint8Array | ArrayBuffer>(file);

      if (bundled !== null && bundled !== undefined) return normalizeFont(bundled);
    } catch {
      // Fall through to the filesystem and origin fetch paths.
    }

    try {
      return await readFile(join(process.cwd(), "public", "fonts", file));
    } catch {
      return fetchFont(origin, file);
    }
  })();

  fontCache.set(file, pending);

  return pending;
};

const font = (origin: string, file: string, weight: number) => ({
  name: "Be Vietnam Pro",
  weight,
  style: "normal",
  data: () => loadFont(origin, file),
});

const pillar = (kicker: string, title: string) =>
  container({
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2,
      padding: "14px 18px",
      borderRadius: 14,
      border: "1px solid rgba(57, 215, 255, 0.32)",
      backgroundColor: "rgba(10, 32, 42, 0.65)",
    },
    children: [
      text(kicker, {
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: 2,
        color: "#8fe9ff",
      }),
      text(title, { fontSize: 20, fontWeight: 700, color: "#e7f2f4" }),
    ],
  });

export default defineHandler(async (event) => {
  const origin = new URL(event.req.url, "http://localhost:3000").origin;
  // Vite dev cannot resolve the native addon through pnpm, so feed the WASM bytes.
  const wasmModule = import.meta.env.DEV ? await readFile(fileURLToPath(wasmUrl)) : undefined;

  const fonts = [
    font(origin, "be-vietnam-pro-regular.ttf", 400),
    font(origin, "be-vietnam-pro-semibold.ttf", 600),
    font(origin, "be-vietnam-pro-bold.ttf", 700),
    font(origin, "be-vietnam-pro-extrabold.ttf", 800),
  ];

  const card = container({
    style: {
      width: `${WIDTH}px`,
      height: `${HEIGHT}px`,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "54px 62px",
      fontFamily: "Be Vietnam Pro",
      color: "#e7f2f4",
      backgroundImage:
        "radial-gradient(circle at 78% 18%, rgba(57, 215, 255, 0.24) 0%, rgba(57, 215, 255, 0) 46%), linear-gradient(135deg, #0b2a36 0%, #07161e 58%, #040b10 100%)",
      position: "relative",
      overflow: "hidden",
    },
    children: [
      container({
        style: {
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 28,
        },
        children: [
          container({
            style: { display: "flex", flexDirection: "column", gap: 18, width: "760px" },
            children: [
              container({
                style: { display: "flex", flexDirection: "row", alignItems: "center", gap: 12 },
                children: [
                  container({
                    style: {
                      width: 42,
                      height: 42,
                      borderRadius: 999,
                      border: "2px solid rgba(242, 212, 139, 0.6)",
                      backgroundColor: "#39d7ff",
                    },
                    children: [],
                  }),
                  text("SS007.R18 · MÔ PHỎNG KINH TẾ CHÍNH TRỊ", {
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: 3,
                    color: "#8fe9ff",
                  }),
                ],
              }),
              text("ĐIỀU HÀNH", {
                fontSize: 96,
                fontWeight: 800,
                letterSpacing: -3,
                lineHeight: 1.08,
                color: "#e7f2f4",
              }),
              text("LƯỚI ĐIỆN", {
                fontSize: 96,
                fontWeight: 800,
                letterSpacing: -3,
                lineHeight: 1.08,
                color: "#8fe9ff",
              }),
              text("NATIONAL GRID COMMAND", {
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 10,
                color: "#d8a94b",
              }),
              text(
                "Một lưới điện, ba khâu, năm năm. Giữ MW ổn định, phủ điện toàn quốc và hai chỉ số niềm tin trên 0%.",
                {
                  fontSize: 24,
                  fontWeight: 600,
                  lineHeight: 1.45,
                  color: "rgba(231, 242, 244, 0.86)",
                  maxWidth: "700px",
                },
              ),
            ],
          }),
          container({
            style: {
              width: 280,
              height: 280,
              borderRadius: 999,
              border: "2px solid rgba(242, 212, 139, 0.45)",
              backgroundColor: "rgba(231, 242, 244, 0.96)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0,
              boxShadow: "0 24px 60px rgba(5, 15, 9, 0.45)",
            },
            children: [
              text("60", {
                fontSize: 150,
                fontWeight: 800,
                lineHeight: 0.9,
                color: "#07161e",
              }),
              text("THÁNG NHIỆM KỲ", {
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: 3,
                color: "#1a7f96",
              }),
              text("2022 – 2026", {
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: 2,
                color: "#0b2a36",
              }),
            ],
          }),
        ],
      }),
      container({
        style: { display: "flex", flexDirection: "row", gap: 14 },
        children: [
          pillar("SẢN XUẤT & MUA ĐIỆN", "IPP, BOT và nhiệt điện"),
          pillar("TRUYỀN TẢI", "500kV và 220kV"),
          pillar("PHÂN PHỐI", "Sáu bậc giá có trần"),
        ],
      }),
      container({
        style: {
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid rgba(242, 212, 139, 0.24)",
          paddingTop: 18,
        },
        children: [
          text("Chơi trực tiếp trên trình duyệt", {
            fontSize: 18,
            fontWeight: 600,
            color: "rgba(231, 242, 244, 0.74)",
          }),
          text("ĐIỀU HÀNH LƯỚI ĐIỆN QUỐC GIA", {
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 3,
            color: "#8fe9ff",
          }),
        ],
      }),
    ],
  });

  const imageOptions = {
    width: WIDTH,
    height: HEIGHT,
    fonts,
    headers: {
      "Cache-Control": "public, max-age=86400, immutable",
    },
  };

  return wasmModule === undefined
    ? new ImageResponse(card, imageOptions)
    : new ImageResponse(card, { ...imageOptions, module: wasmModule });
});
