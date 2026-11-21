import { expect, test, type Page } from "@playwright/test";

const startGame = async (page: Page): Promise<void> => {
  await page.goto("/");
  await expect(page.locator(".title-screen")).toBeVisible();
  await page.getByRole("button", { name: /Bắt đầu nhiệm kỳ/i }).click();
  await expect(page.locator(".game-shell")).toHaveAttribute("data-screen", "game");
  await page.getByRole("button", { name: /Bỏ qua hướng dẫn/i }).click();
  await expect(page.locator(".tutorial-modal")).toHaveCount(0);
};

const expectNoOverflow = async (page: Page): Promise<void> => {
  const widths = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));

  expect(widths.scroll).toBeLessThanOrEqual(widths.viewport + 1);
};

const expectMonth = async (page: Page, label: string): Promise<void> => {
  await expect(page.locator(".date-main")).toContainText(label);
  await expect(page.locator(".mobile-date")).toContainText(label);
};

test("reserves the continue action and keeps settings reachable on mobile", async ({ page }) => {
  await page.goto("/");
  const continueButton = page.getByRole("button", { name: /Tiếp tục ván đang lưu/i });
  await expect(continueButton).toBeVisible();
  await expect(continueButton).toBeDisabled();
  await expect(page.getByRole("main")).toHaveCount(1);

  await startGame(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Kho lưu và cài đặt" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Độc Quyền Kinh Tế/i })).toBeVisible();
});

test("exposes named meters, the motion switch, and mobile tab state", async ({ page }) => {
  await startGame(page);

  const meters = page.getByRole("meter");
  await expect.poll(() => meters.count()).toBeGreaterThan(0);

  const invalid = await meters.evaluateAll((nodes) =>
    nodes
      .filter((node) => {
        const label = node.getAttribute("aria-label");
        const now = Number(node.getAttribute("aria-valuenow"));
        const max = Number(node.getAttribute("aria-valuemax"));

        return !label || Number.isNaN(now) || now < 0 || now > max;
      })
      .map((node) => node.outerHTML),
  );

  expect(invalid).toEqual([]);

  await page.getByRole("button", { name: "Kho lưu và cài đặt" }).click();
  await expect(page.getByRole("switch", { name: "Giảm chuyển động" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".save-modal")).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  const tariffTab = page.locator(".mobile-tab").filter({ hasText: "Giá" });
  const overviewTab = page.locator(".mobile-tab").filter({ hasText: "Tổng quan" });
  await tariffTab.click();
  await expect(tariffTab).toHaveAttribute("aria-expanded", "true");
  await expect(overviewTab).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".sheet-tab").filter({ hasText: "Giá" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("loads the deferred village scene once and recovers from a failed chunk", async ({ page }) => {
  let blocked = true;

  await page.route(/create-village-scene/, (route) => (blocked ? route.abort() : route.continue()));
  await page.goto("/");
  await expect(page.locator(".title-poster img")).toBeVisible();
  await page.getByRole("button", { name: /Bắt đầu nhiệm kỳ/i }).click();
  await page.getByRole("button", { name: /Bỏ qua hướng dẫn/i }).click();
  await expect(page.getByRole("button", { name: /Thử lại/i })).toBeVisible({ timeout: 15_000 });

  blocked = false;
  await page.getByRole("button", { name: /Thử lại/i }).click();
  await expect(page.locator(".title-screen")).toBeVisible();
  await page.getByRole("button", { name: /Bắt đầu nhiệm kỳ/i }).click();
  await page.getByRole("button", { name: /Bỏ qua hướng dẫn/i }).click();
  await expect(page.locator(".scene-loading")).toHaveCount(0, { timeout: 20_000 });
  await expect(page.locator(".village-canvas")).toHaveCount(1);
});

test("loads the scene from a deferred production chunk", async ({ page }) => {
  test.skip(process.env.PLAYWRIGHT_SERVER !== "start", "production server only");

  const sceneChunks: string[] = [];
  page.on("response", (response) => {
    const path = new URL(response.url()).pathname;

    if (/\/assets\/create-village-scene-.*\.js/.test(path)) sceneChunks.push(path);
  });

  await page.goto("/");
  await expect(page.locator(".title-poster img")).toBeVisible();
  expect(sceneChunks).toEqual([]);

  await startGame(page);
  await expect.poll(() => sceneChunks.length, { timeout: 15_000 }).toBeGreaterThan(0);
  await expect(page.locator(".scene-loading")).toHaveCount(0, { timeout: 20_000 });
  await expect(page.locator(".village-canvas")).toHaveCount(1);
});

test("renders Iconify icons without API calls or untracked reads", async ({ page }) => {
  const diagnostics: string[] = [];
  const iconRequests: string[] = [];
  page.on("console", (message) => {
    if (message.text().includes("STRICT_READ_UNTRACKED")) diagnostics.push(message.text());
  });
  page.on("request", (request) => {
    if (request.url().includes("api.iconify.design")) iconRequests.push(request.url());
  });

  await page.route(/api\.iconify\.design/, (route) => route.abort());
  await page.goto("/");

  const icon = page.locator(".title-screen .title-role iconify-icon").first();
  await expect(icon).toBeVisible();

  const registered = await page.evaluate(() => customElements.get("iconify-icon") !== undefined);
  expect(registered).toBe(true);

  await expect
    .poll(() => icon.evaluate((element) => element.shadowRoot?.querySelector("svg") !== null))
    .toBe(true);

  await startGame(page);
  await expect(page.locator(".top-bar")).toBeVisible();

  expect(diagnostics).toEqual([]);
  expect(iconRequests).toEqual([]);
});

test("serves the generated Open Graph image and advertises absolute URLs", async ({
  request,
  page,
}) => {
  const response = await request.get("/og.png");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/png");
  expect(response.headers()["cache-control"]).toContain("max-age=86400");
  const png = await response.body();
  expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);

  await page.goto("/");
  const image = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(image).toMatch(/^https:\/\/.+\/og\.png$/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
});

test("title, tutorial, and first month on every viewport", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Độc Quyền Kinh Tế/i })).toBeVisible();
  await expect(page.locator(".title-poster img")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expectNoOverflow(page);
  await startGame(page);
  await expect(page.locator(".top-bar")).toBeVisible();
  await expect(page.locator(".village-canvas")).toBeVisible();
  await expectNoOverflow(page);
  await expectMonth(page, "Tháng 1/2022");
  await page.getByRole("button", { name: /Kết thúc tháng/i }).click();
  await expectMonth(page, "Tháng 2/2022");
});

test("mobile navigation opens the tariff sheet with large touch targets", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 1000) >= 1101, "mobile sheet is below desktop");
  await startGame(page);
  await page.locator(".mobile-tab").filter({ hasText: "Giá" }).click();
  await expect(page.locator(".mobile-sheet")).toBeVisible();
  await expect(page.locator(".slider-row").first()).toBeVisible();

  const sizes = await page.evaluate(() => {
    const controls = [
      ...document.querySelectorAll<HTMLElement>('button, [data-slot="slider-control"]'),
    ];

    return controls.flatMap((element) => {
      const rect = element.getBoundingClientRect();

      return rect.width > 0 && rect.height > 0 ? [{ height: rect.height, width: rect.width }] : [];
    });
  });

  for (const size of sizes) {
    expect(size.height).toBeGreaterThanOrEqual(43.5);
  }

  await expectNoOverflow(page);
});

test("workspace opens on desktop and exposes every analytical panel", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1101, "workspace dock is desktop only");
  await startGame(page);
  await page.locator(".bottom-dock-tab").filter({ hasText: "Tổng quan" }).click();
  await expect(page.locator(".workspace-modal")).toBeVisible();
  await expect(page.locator('[data-slot="tabs-tab"]')).toHaveCount(7);
  await page.locator('[data-slot="tabs-tab"]').filter({ hasText: "Tài chính" }).click();
  await expect(
    page.locator(".workspace-modal .panel-title").filter({ hasText: "Báo cáo lãi lỗ tháng" }),
  ).toBeVisible();
  await page.locator(".workspace-head .icon-btn").click();
  await expect(page.locator(".workspace-modal")).toHaveCount(0);
});

test("tariff ceiling rejects an over-priced basket", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1101, "desktop workspace only");
  await startGame(page);
  await page.locator(".bottom-dock-tab").filter({ hasText: "Tổng quan" }).click();
  await page.locator('[data-slot="tabs-tab"]').filter({ hasText: "Bán lẻ" }).click();
  const sliders = page.locator('[data-slot="slider"]');
  await expect(sliders).toHaveCount(5);
  const inputs = page.locator('[data-slot="slider-thumb"] input');

  for (let index = 0; index < 4; index += 1) {
    await inputs.nth(index).focus();
    await page.keyboard.press("End");
  }

  await expect(page.getByText("Vượt trần")).toBeVisible();
  await expect(page.getByRole("button", { name: /Áp dụng biểu giá/i })).toBeDisabled();
});

test("save, reload, and continue restore the player state", async ({ page }) => {
  await startGame(page);
  await page.getByRole("button", { name: /Kết thúc tháng/i }).click();
  await expectMonth(page, "Tháng 2/2022");
  await page.locator(".top-actions .icon-btn").last().click();
  await expect(page.locator(".save-modal")).toBeVisible();
  await page.locator(".slot-card").first().getByRole("button", { name: /^Lưu$/ }).click();
  await expect(page.locator(".toast")).toContainText("Đã lưu ván chơi.");
  await page.locator(".save-head .icon-btn").click();
  await page.reload();
  await expect(page.getByRole("button", { name: /Tiếp tục ván đang lưu/i })).toBeVisible();
  await page.getByRole("button", { name: /Tiếp tục ván đang lưu/i }).click();
  await expect(page.locator(".game-shell")).toHaveAttribute("data-screen", "game");
  await expectMonth(page, "Tháng 2/2022");
});

test("captures the title screen and game shell for visual review", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.waitForTimeout(1_200);
  await testInfo.attach(`${testInfo.project.name}-title`, {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await startGame(page);
  await page.waitForTimeout(1_200);
  await testInfo.attach(`${testInfo.project.name}-game`, {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("event decision appears in June and resolves into a consequence", async ({ page }) => {
  await startGame(page);

  for (let index = 0; index < 5; index += 1) {
    await page.getByRole("button", { name: /Kết thúc tháng/i }).click();
    await page.waitForTimeout(250);
  }

  await expect(page.locator(".event-modal")).toBeVisible();
  await expect(page.getByRole("heading", { name: /El Niño/i })).toBeVisible();
  await page.locator(".event-choice").first().click();
  await expect(page.locator(".outcome-modal")).toBeVisible();
  await page
    .getByRole("button", { name: /Tiếp tục/i })
    .last()
    .click();
  await expect(page.locator(".event-modal")).toHaveCount(0);
});
