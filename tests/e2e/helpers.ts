import { expect, type Page } from "@playwright/test";

export const waitForRightDrawer = async (page: Page): Promise<number> => {
  const width = page.viewportSize()?.width ?? 1440;

  await expect
    .poll(async () => {
      const box = await page.locator(".workspace-drawer").boundingBox();

      return box === null ? false : Math.abs(Math.round(box.x + box.width) - width) <= 1;
    })
    .toBe(true);

  return width;
};

export const expectNoOverflow = async (page: Page): Promise<void> => {
  const widths = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));

  expect(widths.scroll).toBeLessThanOrEqual(widths.viewport + 1);
};
