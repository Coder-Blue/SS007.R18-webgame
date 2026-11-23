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

  await expect(page.locator(".toast")).toBeVisible();

  const boxes = await page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector(selector);

      if (element === null) throw new Error(`missing ${selector}`);
      const box = element.getBoundingClientRect();

      return { top: box.top, bottom: box.bottom, left: box.left, right: box.right };
    };

    return {
      topBar: rect(".top-bar"),
      paused: rect(".paused-banner"),
      badges: rect(".scene-badges"),
      toast: rect(".toast"),
    };
  });

  const overlaps = (
    left: { left: number; right: number },
    right: { left: number; right: number },
  ) => left.left < right.right && right.left < left.right;

  expect(boxes.badges.top).toBeGreaterThanOrEqual(boxes.topBar.bottom);
  expect(boxes.toast.top).toBeGreaterThanOrEqual(boxes.topBar.bottom);
  expect(boxes.paused.top).toBeGreaterThanOrEqual(boxes.topBar.bottom);

  if (overlaps(boxes.badges, boxes.toast)) {
    expect(boxes.toast.top).toBeGreaterThanOrEqual(boxes.badges.bottom);
  }

  if (overlaps(boxes.toast, boxes.paused)) {
    expect(boxes.paused.top).toBeGreaterThanOrEqual(boxes.toast.bottom);
  } else if (overlaps(boxes.badges, boxes.paused)) {
    expect(boxes.paused.top).toBeGreaterThanOrEqual(boxes.badges.bottom);
  }
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
