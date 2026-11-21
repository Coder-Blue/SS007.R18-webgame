import { expect, test } from "@playwright/test";

const criticalPreloads = [
  "/fonts/be-vietnam-pro-400-vietnamese.woff2",
  "/fonts/be-vietnam-pro-400-latin.woff2",
  "/fonts/be-vietnam-pro-800-vietnamese.woff2",
  "/fonts/be-vietnam-pro-800-latin.woff2",
];

const faces = [
  { weight: 400, postScriptName: "BeVietnamPro-Regular" },
  { weight: 500, postScriptName: "BeVietnamPro-Medium" },
  { weight: 600, postScriptName: "BeVietnamPro-SemiBold" },
  { weight: 700, postScriptName: "BeVietnamPro-Bold" },
  { weight: 800, postScriptName: "BeVietnamPro-ExtraBold" },
] as const;

const woff2Files = faces.flatMap((face) => [
  `/fonts/be-vietnam-pro-${face.weight}-vietnamese.woff2`,
  `/fonts/be-vietnam-pro-${face.weight}-latin.woff2`,
]);

const weights = faces.map((face) => face.weight);

const sampleText =
  "Độc quyền kinh tế Ế Ệ Ỹ ữ ợ ẩ ẫ ậ ắ ặ ể ễ ệ ố ồ ổ ỗ ộ ớ ờ ở ỡ ợ ứ ừ ử ữ ự ỳ ỵ ỷ ỹ 0123";

test("loads every Be Vietnam Pro WOFF2 subset without a failed font request", async ({ page }) => {
  const failedFonts: string[] = [];
  const fontRequests = new Set<string>();
  const fontResponses = new Map<string, { contentType: string; status: number }>();

  const recordFailure = (url: string, reason: string): void => {
    const path = new URL(url).pathname;

    if (path.endsWith(".ttf") || path.endsWith(".woff2")) {
      failedFonts.push(`${url} (${reason})`);
    }
  };

  page.on("request", (request) => {
    if (request.resourceType() === "font") {
      fontRequests.add(new URL(request.url()).pathname);
    }
  });
  page.on("requestfailed", (request) => {
    recordFailure(request.url(), request.failure()?.errorText ?? "request failed");
  });
  page.on("response", (response) => {
    const path = new URL(response.url()).pathname;

    if (path.startsWith("/fonts/")) {
      fontResponses.set(path, {
        contentType: response.headers()["content-type"] ?? "",
        status: response.status(),
      });
    }

    if (response.status() >= 400) {
      recordFailure(response.url(), `HTTP ${response.status()}`);
    }
  });

  await page.goto("/");
  await expect(page.locator(".title-screen")).toBeVisible();

  const fonts = await page.evaluate(async (text) => {
    const requestedWeights = [400, 500, 600, 700, 800];
    await Promise.allSettled(
      requestedWeights.map((weight) =>
        document.fonts.load(`${weight} 16px "Be Vietnam Pro"`, text),
      ),
    );
    await document.fonts.ready;

    const loadedWeights = [
      ...new Set(
        [...document.fonts].flatMap((face) =>
          face.family === "Be Vietnam Pro" && face.status === "loaded" ? [Number(face.weight)] : [],
        ),
      ),
    ].toSorted((left, right) => left - right);

    return {
      status: document.fonts.status,
      checks: requestedWeights.map((weight) => ({
        weight,
        loaded: document.fonts.check(`${weight} 16px "Be Vietnam Pro"`, text),
      })),
      loadedWeights,
    };
  }, sampleText);

  await expect.poll(() => fontResponses.size, { timeout: 5_000 }).toBe(woff2Files.length);

  expect(failedFonts).toEqual([]);
  expect([...fontRequests].filter((path) => path.endsWith(".ttf"))).toEqual([]);
  expect([...fontRequests].toSorted()).toEqual(woff2Files.toSorted());
  expect(fonts.status).toBe("loaded");
  expect(fonts.loadedWeights).toEqual(weights);

  for (const file of woff2Files) {
    expect(fontResponses.get(file), `${file} response`).toEqual({
      contentType: "font/woff2",
      status: 200,
    });
  }

  for (const face of faces) {
    expect(fonts.checks, `weight ${face.weight} is available`).toContainEqual({
      weight: face.weight,
      loaded: true,
    });
  }
});

test("maps every weight to its own local WOFF2 face", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".title-screen")).toBeVisible();

  await page.evaluate(async (text) => {
    await Promise.allSettled(
      [400, 500, 600, 700, 800].map((weight) =>
        document.fonts.load(`${weight} 16px "Be Vietnam Pro"`, text),
      ),
    );
    await document.fonts.ready;

    const host = document.createElement("div");
    host.id = "font-probes";
    host.style.cssText = "position:fixed;left:0;top:0;opacity:0;pointer-events:none;z-index:-1";

    for (const weight of [400, 500, 600, 700, 800]) {
      const probe = document.createElement("span");
      probe.dataset.weight = String(weight);
      probe.style.font = `${weight} 32px "Be Vietnam Pro"`;
      probe.textContent = "ĐỘC QUYỀN";
      host.append(probe);
    }

    document.body.append(host);
  }, sampleText);

  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");

  const { root } = await cdp.send("DOM.getDocument", { depth: -1 });

  for (const face of faces) {
    const { nodeId } = await cdp.send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector: `#font-probes [data-weight="${face.weight}"]`,
    });

    expect(nodeId, `weight ${face.weight} probe exists`).toBeGreaterThan(0);

    const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
    const localFonts = fonts.filter((font) => font.isCustomFont);

    expect(localFonts.length, `weight ${face.weight} has a local web font`).toBeGreaterThan(0);

    for (const font of localFonts) {
      expect(font.postScriptName, `weight ${face.weight} uses the local face`).toBe(
        face.postScriptName,
      );
    }
  }

  await cdp.detach();
});

test("preloads only the four critical regular and extrabold WOFF2 subsets", async ({ page }) => {
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
