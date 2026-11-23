import { expect, test } from "@playwright/test";

test("serves the grid favicon set and links it from the document", async ({ page, request }) => {
  const svg = await request.get("/favicon.svg");
  expect(svg.status()).toBe(200);
  expect(svg.headers()["content-type"]).toContain("image/svg+xml");

  const source = await svg.text();
  expect(source).toContain('viewBox="0 0 64 64"');
  expect(source).toContain("#39d7ff");
  expect(source).toContain("#f2d06b");
  expect(source).toContain("#5bd6a2");

  const png = await request.get("/favicon.png");
  expect(png.status()).toBe(200);
  expect(png.headers()["content-type"]).toContain("image/png");
  const pngBytes = await png.body();
  expect(pngBytes.readUInt32BE(16)).toBe(64);
  expect(pngBytes.readUInt32BE(20)).toBe(64);

  const apple = await request.get("/apple-touch-icon.png");
  expect(apple.status()).toBe(200);
  expect(apple.headers()["content-type"]).toContain("image/png");
  const appleBytes = await apple.body();
  expect(appleBytes.readUInt32BE(16)).toBe(180);
  expect(appleBytes.readUInt32BE(20)).toBe(180);

  const ico = await request.get("/favicon.ico");
  expect(ico.status()).toBe(200);
  expect(ico.headers()["content-type"]).toContain("icon");
  expect((await ico.body()).readUInt16LE(4)).toBe(4);

  await page.goto("/");
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute(
    "href",
    "/favicon.svg?v=2",
  );
  await expect(page.locator('link[rel="icon"][type="image/png"]')).toHaveAttribute(
    "href",
    "/favicon.png?v=2",
  );
  await expect(page.locator('link[rel="icon"][href="/favicon.ico?v=2"]')).toHaveCount(1);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    "/apple-touch-icon.png",
  );
});
