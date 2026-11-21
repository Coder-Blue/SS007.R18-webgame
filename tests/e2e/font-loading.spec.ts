import { expect, test } from "@playwright/test";

const criticalPreloads = [
  "/fonts/be-vietnam-pro-400-vietnamese.woff2",
  "/fonts/be-vietnam-pro-400-latin.woff2",
  "/fonts/be-vietnam-pro-800-vietnamese.woff2",
  "/fonts/be-vietnam-pro-800-latin.woff2",
];

const sampleText = "Độc quyền kinh tế 0123";

test("loads every Be Vietnam Pro weight without a failed font request", async ({ page }) => {
  const failedFonts: string[] = [];

  const recordFailure = (url: string, reason: string): void => {
    if (url.endsWith(".woff2")) {
      failedFonts.push(`${url} (${reason})`);
    }
  };

  page.on("requestfailed", (request) => {
    recordFailure(request.url(), request.failure()?.errorText ?? "request failed");
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      recordFailure(response.url(), `HTTP ${response.status()}`);
    }
  });

  await page.goto("/");
  await expect(page.locator(".title-screen")).toBeVisible();

  const fonts = await page.evaluate(async (text) => {
    const weights = [400, 600, 700, 800];
    await Promise.all(
      weights.map((weight) => document.fonts.load(`${weight} 16px "Be Vietnam Pro"`, text)),
    );
    await document.fonts.ready;

    const loadedWeights = [
      ...new Set(
        [...document.fonts].flatMap((face) =>
          face.family === "Be Vietnam Pro" && face.status === "loaded" ? [Number(face.weight)] : [],
        ),
      ),
    ];

    return {
      status: document.fonts.status,
      checks: weights.map((weight) => ({
        weight,
        loaded: document.fonts.check(`${weight} 16px "Be Vietnam Pro"`, text),
      })),
      loadedWeights,
    };
  }, sampleText);

  expect(failedFonts).toEqual([]);
  expect(fonts.status).toBe("loaded");
  expect(fonts.loadedWeights).not.toContain(500);

  for (const weight of [400, 600, 700, 800]) {
    expect(fonts.loadedWeights, `weight ${weight} is loaded`).toContain(weight);
  }

  expect(fonts.checks).toEqual([
    { weight: 400, loaded: true },
    { weight: 600, loaded: true },
    { weight: 700, loaded: true },
    { weight: 800, loaded: true },
  ]);
});

test("preloads only the critical 400 and 800 font subsets", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".title-screen")).toBeVisible();

  const preloads = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLLinkElement>('link[rel="preload"][as="font"]')].map(
      (link) => ({
        href: link.getAttribute("href"),
        type: link.getAttribute("type"),
        crossOrigin: link.getAttribute("crossorigin"),
      }),
    ),
  );

  expect(preloads).toEqual(
    criticalPreloads.map((href) => ({ href, type: "font/woff2", crossOrigin: "anonymous" })),
  );
});
