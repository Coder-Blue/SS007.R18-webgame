import { expect, test, type Page } from "@playwright/test";
import { WIDE_DESKTOP_MIN } from "../../src/ui/tour-config";

const startGame = async (page: Page): Promise<void> => {
  await page.goto("/");
  await expect(page.locator(".title-screen")).toBeVisible();
  await page.getByRole("button", { name: /Bắt đầu nhiệm kỳ/i }).click();
  await expect(page.locator(".game-shell")).toHaveAttribute("data-screen", "game");
  await expect(page.locator(".tutorial-modal")).toBeVisible();
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
  await expect
    .poll(async () => {
      const mobile = page.locator(".mobile-date");
      const desktop = page.locator(".date-main");

      if (await mobile.isVisible()) return mobile.textContent();

      return desktop.textContent();
    })
    .toContain(label);
};

const setSpeed3 = async (page: Page): Promise<void> => {
  await page.keyboard.press("3");
  await expect(page.getByRole("button", { name: "Tốc độ 3 lần" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
};

test("reserves the continue action and keeps settings reachable on mobile", async ({ page }) => {
  await page.goto("/");
  const continueButton = page.getByRole("button", { name: /Tiếp tục nhiệm kỳ đang lưu/i });
  await expect(continueButton).toBeVisible();
  await expect(continueButton).toBeDisabled();
  await expect(page.getByRole("main")).toHaveCount(1);

  await startGame(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Kho lưu và cài đặt" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Điều Hành Lưới Điện Quốc Gia/i })).toBeVisible();
});

test("pauses, resumes and advances a month at three times speed", async ({ page }) => {
  await startGame(page);
  await expectMonth(page, "Tháng 1/2022");
  await expect(page.locator(".paused-banner")).toBeVisible();

  await page.getByRole("button", { name: "Tiếp tục mô phỏng" }).click();
  await expect(page.locator(".paused-banner")).toHaveCount(0);
  await page.getByRole("button", { name: "Tạm dừng mô phỏng" }).click();
  await expect(page.locator(".paused-banner")).toBeVisible();

  await setSpeed3(page);
  await page.getByRole("button", { name: "Tiếp tục mô phỏng" }).click();
  await expectMonth(page, "Tháng 2/2022");
});

test("exposes named meters, the motion switch, and the save flow", async ({ page }) => {
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
  await page.locator(".slot-card").first().getByRole("button", { name: /^Lưu$/ }).click();
  await expect(page.locator(".toast")).toContainText("Đã lưu nhiệm kỳ.");
  await page.keyboard.press("Escape");
  await expect(page.locator(".save-modal")).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("button", { name: /Tiếp tục nhiệm kỳ đang lưu/i })).toBeEnabled();
  await page.getByRole("button", { name: /Tiếp tục nhiệm kỳ đang lưu/i }).click();
  await expect(page.locator(".game-shell")).toHaveAttribute("data-screen", "game");
});

test("loads the deferred power scene once and recovers from a failed chunk", async ({ page }) => {
  let blocked = true;

  await page.route(/create-power-scene/, (route) => (blocked ? route.abort() : route.continue()));
  await page.goto("/");
  await expect(page.locator(".title-poster")).toBeVisible();
  await page.getByRole("button", { name: /Bắt đầu nhiệm kỳ/i }).click();
  await page.getByRole("button", { name: /Bỏ qua hướng dẫn/i }).click();
  await expect(page.getByRole("button", { name: /Thử lại/i })).toBeVisible({ timeout: 15_000 });

  blocked = false;
  await page.getByRole("button", { name: /Thử lại/i }).click();
  await expect(page.locator(".title-screen")).toBeVisible();
  await startGame(page);
  await expect(page.locator(".scene-loading")).toHaveCount(0, { timeout: 20_000 });
  await expect(page.locator(".power-canvas")).toHaveCount(1);
});

test("loads the scene from a deferred production chunk", async ({ page }) => {
  test.skip(process.env.PLAYWRIGHT_SERVER !== "start", "production server only");

  const sceneChunks: string[] = [];
  page.on("response", (response) => {
    const path = new URL(response.url()).pathname;

    if (/\/assets\/create-power-scene-.*\.js/.test(path)) sceneChunks.push(path);
  });

  await page.goto("/");
  await expect(page.locator(".title-poster")).toBeVisible();
  expect(sceneChunks).toEqual([]);

  await startGame(page);
  await expect.poll(() => sceneChunks.length, { timeout: 15_000 }).toBeGreaterThan(0);
  await expect(page.locator(".scene-loading")).toHaveCount(0, { timeout: 20_000 });
  await expect(page.locator(".power-canvas")).toHaveCount(1);
});

const expectFreeTourFocus = async (page: Page, node: string) => {
  await expect(page.locator(`.scene-tour-focus[data-tour-node="${node}"]`)).toBeVisible();

  const geometry = await page.evaluate(() => {
    const chip = document.querySelector<HTMLElement>(".scene-tour-focus");

    if (chip === null) return null;
    const x = (Number(chip.dataset.anchorX) + 0.5) * window.innerWidth;
    const y = (Number(chip.dataset.anchorY) + 0.5) * window.innerHeight;
    const top = document.elementFromPoint(x, y);

    return {
      x,
      y,
      overDrawer: top?.closest(".workspace-drawer") !== null,
      overTutorial: top?.closest(".tutorial-modal") !== null,
      overRail: top?.closest(".dock-left") !== null,
    };
  });

  expect(geometry).not.toBeNull();
  expect(geometry?.overDrawer).toBe(false);
  expect(geometry?.overTutorial).toBe(false);
  expect(geometry?.overRail).toBe(false);

  return geometry;
};

test("walks the tutorial through live panels and map nodes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Bắt đầu nhiệm kỳ/i }).click();
  await page.evaluate(() => {
    window.addEventListener("grid:tour-focus", (event) => {
      document.body.dataset.tourTarget = event instanceof CustomEvent ? String(event.detail) : "";
    });
  });

  const tutorial = page.locator(".tutorial-modal");
  await expect(tutorial).toBeVisible();
  const width = page.viewportSize()?.width ?? 0;
  const desktop = width >= WIDE_DESKTOP_MIN;

  test.skip(width > 1180 && !desktop, "panels auto-open only from 1340 px");

  await tutorial.getByRole("button", { name: "Tiếp tục" }).click();

  if (desktop) {
    await expect(page.locator(".workspace-drawer")).toBeVisible();
    await expect(page.locator('[data-tutorial="production-panel"]')).toBeVisible();
  } else {
    await expect(
      page.locator('.mobile-nav [data-tutorial="production"][data-tutorial-active="true"]').first(),
    ).toBeVisible();
  }

  const productionFocus = await expectFreeTourFocus(page, "thermal");

  await expect
    .poll(() => page.evaluate(() => document.activeElement?.closest(".tutorial-modal") !== null))
    .toBe(true);

  if (desktop) {
    const drawer = await page.locator(".workspace-drawer").boundingBox();
    const rail = await page.locator(".dock-left").boundingBox();

    expect(productionFocus?.x).toBeGreaterThan((rail?.x ?? 0) + (rail?.width ?? 0));
    expect(productionFocus?.x).toBeLessThan(drawer?.x ?? 0);
  }

  await tutorial.getByRole("button", { name: "Tiếp tục" }).click();

  if (desktop) await expect(page.locator('[data-tutorial="grid-panel"]')).toBeVisible();
  await expectFreeTourFocus(page, "rural");

  await tutorial.getByRole("button", { name: "Tiếp tục" }).click();

  if (desktop) await expect(page.locator('[data-tutorial="tariff-panel"]')).toBeVisible();
  await expectFreeTourFocus(page, "urban");

  await tutorial.getByRole("button", { name: "Tiếp tục" }).click();
  await expect(page.locator(".workspace-drawer")).toHaveCount(0);
  await expect(page.locator(".scene-tour-focus")).toHaveCount(0);
  await expect.poll(() => page.locator("body").getAttribute("data-tour-target")).toBe("null");

  const pause = page.getByRole("button", { name: /mô phỏng/i }).first();
  const pauseBox = await pause.boundingBox();

  expect(pauseBox).not.toBeNull();

  const pauseHit = await page.evaluate(
    ({ x, y }) =>
      document.elementFromPoint(x, y)?.closest("button")?.getAttribute("aria-label") ?? null,
    {
      x: (pauseBox?.x ?? 0) + (pauseBox?.width ?? 0) / 2,
      y: (pauseBox?.y ?? 0) + (pauseBox?.height ?? 0) / 2,
    },
  );

  expect(pauseHit).toMatch(/mô phỏng/i);

  await tutorial.getByRole("button", { name: "Bắt đầu điều hành" }).click();
  await expect(page.locator(".tutorial-modal")).toHaveCount(0);
});

test("keeps the tutorial focus free on a short wide desktop", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < WIDE_DESKTOP_MIN, "wide desktop only");
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");
  await page.getByRole("button", { name: /Bắt đầu nhiệm kỳ/i }).click();
  const tutorial = page.locator(".tutorial-modal");
  await tutorial.getByRole("button", { name: "Tiếp tục" }).click();
  await expect(page.locator(".workspace-drawer")).toBeVisible();

  const geometry = await expectFreeTourFocus(page, "thermal");
  const drawer = await page.locator(".workspace-drawer").boundingBox();
  const rail = await page.locator(".dock-left").boundingBox();

  expect(geometry?.x).toBeGreaterThan((rail?.x ?? 0) + (rail?.width ?? 0));
  expect(geometry?.x).toBeLessThan(drawer?.x ?? 0);
});

test("keeps the tutorial step when it is reopened", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Bắt đầu nhiệm kỳ/i }).click();

  const tutorial = page.locator(".tutorial-modal");
  await expect(tutorial).toBeVisible();
  await tutorial.getByRole("button", { name: "Tiếp tục" }).click();
  await expect(tutorial.getByText(/Chọn nguồn nhập điện và nhiên liệu/i)).toBeVisible();
  await tutorial.getByRole("button", { name: "Bỏ qua hướng dẫn" }).click();
  await expect(tutorial).toHaveCount(0);

  await page.getByRole("button", { name: "Hướng dẫn nhập cuộc" }).click();
  await expect(page.locator(".tutorial-modal").getByText(/Chủ tịch giao việc/i)).toBeVisible();
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

test("title and first month stay inside every viewport", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Điều Hành Lưới Điện Quốc Gia/i })).toBeVisible();
  await expect(page.locator(".title-poster")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expectNoOverflow(page);
  await startGame(page);
  await expect(page.locator(".top-bar")).toBeVisible();
  await expect(page.locator(".power-canvas")).toBeVisible();
  await expect(page.locator(".power-canvas")).toHaveAttribute("aria-describedby", "scene-summary");
  await expect(page.locator("#scene-summary")).toContainText("phủ điện");
  await expect(page.locator("#scene-summary")).toBeHidden();
  await expectNoOverflow(page);
  await expectMonth(page, "Tháng 1/2022");
});

test("desktop workspace exposes every panel without overlapping chrome", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1181, "workspace dock is desktop only");
  await startGame(page);
  await expect(page.locator(".top-bar")).toBeVisible();
  await page.locator(".dock-tab").filter({ hasText: "Tài chính" }).click();
  await expect(page.locator(".workspace-drawer")).toBeVisible();
  await expect(page.locator(".workspace-drawer [role=tab]")).toHaveCount(6);
  await expect(
    page.locator(".workspace-drawer .panel-title").filter({ hasText: "Sổ tài chính" }),
  ).toBeVisible();

  const boxes = await page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector(selector);

      if (element === null) return null;
      const box = element.getBoundingClientRect();

      return { top: box.top, bottom: box.bottom, left: box.left, right: box.right };
    };

    return {
      topBar: rect(".top-bar"),
      leftDock: rect(".dock-left"),
      bottomDock: rect(".bottom-dock"),
      drawer: rect(".workspace-drawer"),
    };
  });

  if (boxes.topBar && boxes.leftDock) {
    expect(boxes.topBar.bottom).toBeLessThanOrEqual(boxes.leftDock.top);
  }

  if (boxes.leftDock && boxes.bottomDock) {
    expect(boxes.leftDock.bottom).toBeLessThanOrEqual(boxes.bottomDock.top);
  }

  if (boxes.drawer) expect(boxes.drawer.right).toBeLessThanOrEqual(1440);

  await page.locator(".workspace-drawer [role=tab]").filter({ hasText: "Truyền tải" }).click();
  await expect(
    page.locator(".workspace-drawer .panel-title").filter({ hasText: "Bản đồ phủ điện" }),
  ).toBeVisible();
  await page.locator(".workspace-head .icon-btn").click();
  await expect(page.locator(".workspace-drawer")).toHaveCount(0);
});

test("mobile navigation opens the tariff sheet with large touch targets", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 1000) >= 1181, "mobile sheet is below desktop");
  await startGame(page);
  await page.locator(".mobile-tab").filter({ hasText: "Phân phối & giá" }).click();
  await expect(page.locator(".mobile-sheet")).toBeVisible();
  await expect(
    page.locator(".mobile-sheet .panel-title").filter({ hasText: "Biểu giá bán lẻ" }),
  ).toBeVisible();
  await expect(page.locator(".mobile-sheet .slider-thumb").first()).toBeVisible();

  const sizes = await page.evaluate(() => {
    const controls = [...document.querySelectorAll<HTMLElement>("button")];

    return controls.flatMap((element) => {
      const rect = element.getBoundingClientRect();

      return rect.width > 0 && rect.height > 0 ? [{ height: rect.height, width: rect.width }] : [];
    });
  });

  for (const size of sizes) {
    expect(size.height).toBeGreaterThanOrEqual(43.5);
  }

  const sliders = await page.locator(".mobile-sheet .slider-thumb").evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect();

      return { height: box.height, width: box.width };
    }),
  );

  for (const slider of sliders) {
    expect(slider.height).toBeGreaterThanOrEqual(43.5);
    expect(slider.width).toBeGreaterThanOrEqual(43.5);
  }

  await page.waitForTimeout(1_000);
  await page.locator(".sheet-tab").filter({ hasText: "Chính sách" }).click();
  await expect(page.locator(".mobile-sheet")).toContainText("Cải cách cơ cấu");
  await page.locator(".sheet-tab").filter({ hasText: "Tổng quan" }).click();
  await expect(
    page.locator(".mobile-sheet .panel-title").filter({ hasText: "Bức tranh điều hành" }),
  ).toBeVisible();

  await expectNoOverflow(page);
});

test("chart and table legends do not overlap their plots", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1181, "analysis panels are desktop only");
  await startGame(page);
  await page.locator(".dock-tab").filter({ hasText: "Tổng quan" }).click();

  const overlaps = await page.evaluate(() => {
    const pairs = [
      [".workspace-drawer .chart-legend", ".workspace-drawer .chart-scroll"],
      [".workspace-drawer .chart-caption", ".workspace-drawer .chart-scroll"],
    ] as const;

    const result: string[] = [];

    for (const [first, second] of pairs) {
      const a = document.querySelector(first)?.getBoundingClientRect();
      const b = document.querySelector(second)?.getBoundingClientRect();

      if (a && b && a.bottom > b.top && b.bottom > a.top && a.right > b.left && b.right > a.left) {
        result.push(`${first} overlaps ${second}`);
      }
    }

    return result;
  });

  expect(overlaps).toEqual([]);
  await page.locator(".workspace-drawer [role=tab]").filter({ hasText: "Tài chính" }).click();
  const tableScrolls = await page.locator(".workspace-drawer .table-scroll").count();
  expect(tableScrolls).toBeGreaterThan(0);
});

test("captures the title screen and game shell for visual review", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.waitForTimeout(1_200);
  await testInfo.attach(`${testInfo.project.name}-title`, {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await startGame(page);
  await page.waitForTimeout(1_800);
  await testInfo.attach(`${testInfo.project.name}-game`, {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});
