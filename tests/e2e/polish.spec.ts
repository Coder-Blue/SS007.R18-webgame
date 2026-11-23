import { expect, test, type Page } from "@playwright/test";

const startGame = async (page: Page): Promise<void> => {
  await page.goto("/");
  await page.getByRole("button", { name: /Bắt đầu nhiệm kỳ/i }).click();
  await expect(page.locator(".game-shell")).toHaveAttribute("data-screen", "game");
  await expect(page.locator(".tutorial-modal")).toBeVisible();
  await page.getByRole("button", { name: /Bỏ qua hướng dẫn/i }).click();
  await expect(page.locator(".tutorial-modal")).toHaveCount(0);
};

test("keeps pause and scene badges below the top bar", async ({ page }) => {
  await startGame(page);

  const boxes = await page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector(selector);

      if (element === null) return null;
      const box = element.getBoundingClientRect();

      return { top: box.top, bottom: box.bottom };
    };

    return {
      topBar: rect(".top-bar"),
      paused: rect(".paused-banner"),
      badges: rect(".scene-badges"),
    };
  });

  if (boxes.paused) expect(boxes.paused.top).toBeGreaterThanOrEqual(boxes.topBar?.bottom ?? 0);

  if (boxes.badges) expect(boxes.badges.top).toBeGreaterThanOrEqual(boxes.topBar?.bottom ?? 0);
});

test("offers the dashboard from the WebGL fallback", async ({ page }) => {
  await page.route(/create-power-scene/, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "throw new Error('WebGL disabled');",
    }),
  );
  await startGame(page);

  const empty = page.locator(".scene-empty");
  await expect(empty).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("#scene-summary")).toContainText("phủ điện");
  await empty.getByRole("button", { name: "Mở bảng điều hành" }).click();
  await expect(page.locator(".workspace-drawer")).toBeVisible();
});
