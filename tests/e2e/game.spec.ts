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

test("title, tutorial, and first month on every viewport", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Độc Quyền Kinh Tế/i })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(1);
  await expectNoOverflow(page);
  await startGame(page);
  await expect(page.locator(".top-bar")).toBeVisible();
  await expect(page.locator(".village-canvas")).toBeVisible();
  await expectNoOverflow(page);
  const before = await page.locator(".date-main").count();
  if (before > 0) await expect(page.locator(".date-main")).toContainText("Tháng 1/2022");
  await page.getByRole("button", { name: /Kết thúc tháng/i }).click();
  await expect(page.locator(".toast")).toBeVisible();
  const desktopDate = page.locator(".date-main");
  if ((await desktopDate.count()) > 0) await expect(desktopDate).toContainText("Tháng 2/2022");
  const mobileDate = page.locator(".mobile-date");
  if ((await mobileDate.count()) > 0) await expect(mobileDate).toContainText("Tháng 2/2022");
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
    return controls
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { height: rect.height, width: rect.width };
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
  await expect(page.locator(".toast")).toBeVisible();
  await page.locator(".top-actions .icon-btn").last().click();
  await expect(page.locator(".save-modal")).toBeVisible();
  await page.locator(".slot-card").first().getByRole("button", { name: /^Lưu$/ }).click();
  await expect(page.locator(".toast")).toBeVisible();
  await page.locator(".save-head .icon-btn").click();
  await page.reload();
  await expect(page.getByRole("button", { name: /Tiếp tục ván đang lưu/i })).toBeVisible();
  await page.getByRole("button", { name: /Tiếp tục ván đang lưu/i }).click();
  await expect(page.locator(".game-shell")).toHaveAttribute("data-screen", "game");
  const desktopDate = page.locator(".date-main");
  if ((await desktopDate.count()) > 0) await expect(desktopDate).toContainText("Tháng 2/2022");
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
