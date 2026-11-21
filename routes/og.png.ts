import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { defineHandler } from "nitro";
import { container, text } from "takumi-js/helpers";
import ImageResponse from "takumi-js/response";
import wasmUrl from "takumi-js/wasm-url";

const WIDTH = 1200;
const HEIGHT = 630;

const font = (origin: string, file: string, weight: number) => ({
  name: "Be Vietnam Pro",
  weight,
  style: "normal",
  data: async () => {
    try {
      return await readFile(join(process.cwd(), "public", "fonts", file));
    } catch {
      const response = await fetch(`${origin}/fonts/${file}`);

      return new Uint8Array(await response.arrayBuffer());
    }
  },
});

const pillar = (kicker: string, title: string) =>
  container({
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2,
      padding: "14px 18px",
      borderRadius: 14,
      border: "1px solid rgba(242, 212, 139, 0.28)",
      backgroundColor: "rgba(13, 33, 22, 0.55)",
    },
    children: [
      text(kicker, {
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: 2,
        color: "#f2d48b",
      }),
      text(title, { fontSize: 20, fontWeight: 700, color: "#f7f0e2" }),
    ],
  });

export default defineHandler(async (event) => {
  const origin = new URL(event.req.url, "http://localhost:3000").origin;
  // Vite dev cannot resolve the native addon through pnpm, so feed the WASM bytes.
  const wasmModule = import.meta.env.DEV ? await readFile(fileURLToPath(wasmUrl)) : undefined;

  const fonts = [
    font(origin, "be-vietnam-pro-600-vietnamese.woff2", 600),
    font(origin, "be-vietnam-pro-600-latin.woff2", 600),
    font(origin, "be-vietnam-pro-800-vietnamese.woff2", 800),
    font(origin, "be-vietnam-pro-800-latin.woff2", 800),
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
      color: "#f7f0e2",
      backgroundImage:
        "radial-gradient(circle at 78% 18%, rgba(216, 169, 75, 0.26) 0%, rgba(216, 169, 75, 0) 46%), linear-gradient(135deg, #1d4a32 0%, #0d2116 58%, #050f09 100%)",
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
                      backgroundColor: "#d8a94b",
                    },
                    children: [],
                  }),
                  text("SS007.R18 · MÔ PHỎNG KINH TẾ CHÍNH TRỊ", {
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: 3,
                    color: "#f2d48b",
                  }),
                ],
              }),
              text("ĐỘC QUYỀN", {
                fontSize: 96,
                fontWeight: 800,
                letterSpacing: -3,
                lineHeight: 1.08,
                color: "#f7f0e2",
              }),
              text("KINH TẾ", {
                fontSize: 96,
                fontWeight: 800,
                letterSpacing: -3,
                lineHeight: 1.08,
                color: "#f2d48b",
              }),
              text("THE RICE MONOPOLY", {
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 10,
                color: "#d8a94b",
              }),
              text(
                "Một làng. Một mạng đường. Một giỏ gạo. Giữ cho dân no, xưởng chạy và ngân sách không sụp.",
                {
                  fontSize: 24,
                  fontWeight: 600,
                  lineHeight: 1.45,
                  color: "rgba(247, 240, 226, 0.84)",
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
              backgroundColor: "rgba(247, 240, 226, 0.94)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0,
              boxShadow: "0 24px 60px rgba(5, 15, 9, 0.45)",
            },
            children: [
              text("5", {
                fontSize: 150,
                fontWeight: 800,
                lineHeight: 0.9,
                color: "#1d4a32",
              }),
              text("NĂM NHIỆM KỲ", {
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: 3,
                color: "#9f7424",
              }),
              text("2022 – 2026", {
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: 2,
                color: "#241d16",
              }),
            ],
          }),
        ],
      }),
      container({
        style: { display: "flex", flexDirection: "row", gap: 14 },
        children: [
          pillar("SẢN XUẤT", "Ruộng nước và cơ giới"),
          pillar("TRUYỀN TẢI", "Đường phủ tới từng hộ"),
          pillar("PHÂN PHỐI", "Bốn bậc giá có trần"),
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
            color: "rgba(247, 240, 226, 0.72)",
          }),
          text("ĐỘC QUYỀN KINH TẾ", {
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 3,
            color: "#f2d48b",
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
