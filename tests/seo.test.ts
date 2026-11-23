import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const readSource = (relativePath: string): string =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");

const readBinary = (relativePath: string): Buffer =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)));

const rootSource = readSource("../src/routes/__root.tsx");
const indexSource = readSource("../src/routes/index.tsx");
const siteSource = readSource("../src/site.ts");
const sitemapSource = readSource("../routes/sitemap.xml.ts");
const robotsSource = readSource("../routes/robots.txt.ts");
const nitroSource = readSource("../nitro.config.ts");
const vercelSource = readSource("../vercel.json");
const responsiveSource = readSource("../src/styles/responsive.css");
const faviconSource = readSource("../public/favicon.svg");

describe("production metadata", () => {
  test("uses the deployed host for absolute URLs", () => {
    expect(siteSource).toContain("https://monopoly-nhom5.vercel.app");
    expect(siteSource).not.toContain("ss007-r18-webgame.vercel.app");
    expect(rootSource).not.toContain("ss007-r18-webgame.vercel.app");
  });

  test("publishes canonical and robots metadata only on the index route", () => {
    expect(indexSource).toContain('rel: "canonical"');
    expect(indexSource).toContain('name: "robots"');
    expect(rootSource).not.toContain('rel: "canonical"');
    expect(rootSource).not.toContain('name: "robots"');
    expect(rootSource).toContain('rel: "sitemap"');
    expect(rootSource).toContain('property: "og:url"');
    expect(rootSource).toContain('property: "og:locale"');
    expect(rootSource).toContain('property: "og:site_name"');
    expect(rootSource).toContain('name: "twitter:description"');
    expect(rootSource).toContain('name: "twitter:image:alt"');
  });

  test("exposes one crawlable sitemap URL and advertises it from robots.txt", () => {
    expect(sitemapSource).toContain("SITE_URL");
    expect(sitemapSource).toContain("<loc>${SITE_URL}/</loc>");
    expect(robotsSource).toContain("Sitemap: ${SITE_URL}/sitemap.xml");
  });

  test("caches static branding assets without caching the HTML shell", () => {
    for (const path of ["/favicon.ico", "/favicon.png", "/favicon.svg", "/apple-touch-icon.png"]) {
      expect(nitroSource).toContain(path);
      expect(vercelSource).toContain(path);
    }

    expect(nitroSource).toContain('"/images/**"');
    expect(vercelSource).toContain('"source": "/images/(.*)"');
    expect(nitroSource).toContain('"cache-control": "public, max-age=2592000"');
    expect(vercelSource).toContain("public, max-age=2592000");
    expect(rootSource).not.toContain("s-maxage");
  });

  test("ships the grid favicon set at its declared sizes", () => {
    expect(faviconSource).toContain('viewBox="0 0 64 64"');
    expect(faviconSource).toContain("#07121b");
    expect(faviconSource).toContain("#39d7ff");
    expect(faviconSource).toContain("#f2d06b");
    expect(faviconSource).toContain("#5bd6a2");
    expect(rootSource).toContain('sizes: "any", href: "/favicon.svg?v=2"');
    expect(rootSource).toContain('href: "/favicon.png?v=2"');
    expect(rootSource).toContain('href: "/favicon.ico?v=2"');
    expect(rootSource).toContain('sizes: "180x180", href: "/apple-touch-icon.png"');

    const png = readBinary("../public/favicon.png");
    expect(png.readUInt32BE(16)).toBe(64);
    expect(png.readUInt32BE(20)).toBe(64);

    const apple = readBinary("../public/apple-touch-icon.png");
    expect(apple.readUInt32BE(16)).toBe(180);
    expect(apple.readUInt32BE(20)).toBe(180);
    expect(apple[25]).toBe(2);

    const ico = readBinary("../public/favicon.ico");
    const count = ico.readUInt16LE(4);
    const expectedSizes = [16, 32, 48, 64];
    expect(count).toBe(expectedSizes.length);

    for (const [index, size] of expectedSizes.entries()) {
      const entry = 6 + index * 16;
      const imageOffset = ico.readUInt32LE(entry + 12);
      expect(ico[entry]).toBe(size);
      expect(ico[entry + 1]).toBe(size);
      expect(ico.readUInt32BE(imageOffset + 16)).toBe(size);
      expect(ico.readUInt32BE(imageOffset + 20)).toBe(size);
    }
  });

  test("keeps the mobile save and settings action visible", () => {
    expect(responsiveSource).not.toContain(".top-actions .icon-btn:nth-of-type(2)");
  });
});
