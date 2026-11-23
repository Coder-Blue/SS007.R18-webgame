import { expect, test } from "@playwright/test";

const startAndRun = async (page: import("@playwright/test").Page): Promise<void> => {
  await page.goto("/");
  await page.getByRole("button", { name: /Bắt đầu nhiệm kỳ/i }).click();

  const tutorial = page.locator(".tutorial-modal");
  await expect(tutorial).toBeVisible();
  await page.getByRole("button", { name: /Bỏ qua hướng dẫn/i }).click();
  await expect(tutorial).toHaveCount(0);

  await page.getByRole("button", { name: "Tiếp tục mô phỏng" }).click();
  await page.keyboard.press("3");
};

const advanceToQuarter = async (page: import("@playwright/test").Page): Promise<void> => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await page.waitForTimeout(500);

    if ((await page.locator(".event-modal").count()) > 0) {
      await page.locator(".event-modal").getByRole("button", { name: "Chọn" }).first().click();
      await page.waitForTimeout(250);

      const resume = page.getByRole("button", { name: "Tiếp tục mô phỏng" });

      if ((await resume.count()) > 0) await resume.click();
    }

    if ((await page.locator(".summary-modal").count()) > 0) return;
  }
};

test("quarter summary replaces the toast with a readable ledger", async ({ page }) => {
  await startAndRun(page);
  await advanceToQuarter(page);

  const summary = page.locator(".summary-modal");
  await expect(summary).toBeVisible();
  await expect(page.locator(".monthly-toast")).toHaveCount(0);
  await expect(summary.locator(".stat")).toHaveCount(0);
  await expect(summary).toContainText("Quý 1 đã khép lại");
  await expect(summary).toContainText("Điện thương phẩm");
  await expect(summary).toContainText("Sổ kết quả");
  await expect(summary).toContainText("Kết quả quý");

  const button = summary.getByRole("button", { name: "Tiếp tục điều hành" });
  const box = await button.boundingBox();
  const viewport = page.viewportSize();

  expect(box).not.toBeNull();

  if (box && viewport) {
    expect(box.height).toBeGreaterThanOrEqual(43.5);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
  }

  await button.click();
  await expect(summary).toHaveCount(0);
});
