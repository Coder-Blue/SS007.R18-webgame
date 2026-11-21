import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const readSource = (relativePath: string): string =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");

const rootSource = readSource("../src/routes/__root.tsx");
const indexSource = readSource("../src/routes/index.tsx");
const siteSource = readSource("../src/site.ts");
const sitemapSource = readSource("../routes/sitemap.xml.ts");
const robotsSource = readSource("../routes/robots.txt.ts");
const nitroSource = readSource("../nitro.config.ts");
const vercelSource = readSource("../vercel.json");
const responsiveSource = readSource("../src/styles/responsive.css");

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
    for (const path of ["/favicon.ico", "/favicon.png", "/favicon.svg"]) {
      expect(nitroSource).toContain(path);
      expect(vercelSource).toContain(path);
    }

    expect(nitroSource).toContain('"/images/**"');
    expect(vercelSource).toContain('"source": "/images/(.*)"');
    expect(nitroSource).toContain('"cache-control": "public, max-age=2592000"');
    expect(vercelSource).toContain("public, max-age=2592000");
    expect(rootSource).not.toContain("s-maxage");
  });

  test("keeps the mobile save and settings action visible", () => {
    expect(responsiveSource).not.toContain(".top-actions .icon-btn:nth-of-type(2)");
  });
});
