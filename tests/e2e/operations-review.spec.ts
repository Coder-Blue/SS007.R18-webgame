import { expect, test, type Page } from "@playwright/test";
import { createInitialState, SAVE_VERSION } from "../../src/domain/constants";
import { waitForRightDrawer } from "./helpers";

const skipTutorial = async (page: Page): Promise<void> => {
  await page.getByRole("button", { name: /Bắt đầu nhiệm kỳ/i }).click();
  await page.getByRole("button", { name: /Bỏ qua hướng dẫn/i }).click();
  await expect(page.locator(".tutorial-modal")).toHaveCount(0);
};

test.beforeEach(async ({ page }) => {
  await page.route(/create-power-scene/, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "throw new Error('WebGL disabled');",
    }),
  );
});

test("works when browser storage is blocked", async ({ page }) => {
  await page.addInitScript(() => {
    for (const kind of ["localStorage", "sessionStorage"]) {
      Object.defineProperty(window, kind, {
        get: () => {
          throw new DOMException("Blocked storage", "SecurityError");
        },
      });
    }
  });

  await page.goto("/");
  await skipTutorial(page);
  await expect(page.getByRole("button", { name: "Tiếp tục mô phỏng" })).toBeVisible();

  await page.getByRole("button", { name: "Kho lưu và cài đặt" }).click();
  const saveModal = page.locator(".save-modal");
  await expect(saveModal).toBeVisible();
  await saveModal.getByRole("button", { name: "Lưu", exact: true }).first().click();
  await expect(page.locator(".toast")).toContainText("Không ghi được vào bộ nhớ trình duyệt.");
});

test("Space activates settings and reload preserves simulation preferences", async ({ page }) => {
  await page.goto("/");
  await skipTutorial(page);
  await page.getByRole("button", { name: "Kho lưu và cài đặt" }).press("Space");
  await expect(page.locator(".save-modal")).toBeVisible();
  await expect(page.locator(".paused-banner")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.keyboard.press("3");
  await page.getByRole("button", { name: "Tiếp tục mô phỏng" }).click();
  await page.reload();
  await page.getByRole("button", { name: /Tiếp tục nhiệm kỳ đang lưu/i }).click();
  await expect(page.getByRole("button", { name: "Tốc độ 3 lần" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: "Tạm dừng mô phỏng" })).toBeVisible();
});

test("event choices survive reload before another month", async ({ page }) => {
  const initial = createInitialState();

  const file = {
    format: "grid-save",
    version: SAVE_VERSION,
    savedAt: "2026-01-01T00:00:00.000Z",
    state: { ...initial, events: { ...initial.events, activeId: "public-skepticism" } },
  };

  await page.addInitScript((save) => {
    if (localStorage.getItem("dhl:autosave") === null) {
      localStorage.setItem("dhl:autosave", JSON.stringify(save));
      sessionStorage.setItem("dhl:session", JSON.stringify({ tutorialDone: true, paused: true }));
    }
  }, file);

  await page.goto("/");
  const resume = page.getByRole("button", { name: /Tiếp tục nhiệm kỳ đang lưu/i });
  await resume.click();

  const event = page.locator(".event-modal");
  await expect(event).toBeVisible();
  await event.getByRole("button", { name: "Chọn" }).first().click();
  await expect(event).toHaveCount(0);

  await page.reload();
  await resume.click();
  await expect(page.getByRole("button", { name: "Tiếp tục mô phỏng" })).toBeVisible();
  await expect(event).toHaveCount(0);
});

test("production controls scroll beneath the header and preview a supplier before applying", async ({
  page,
}) => {
  await page.goto("/");
  await skipTutorial(page);
  await page.getByRole("button", { name: "Sản xuất & mua điện", exact: true }).click();

  const drawer = page.locator(".workspace-drawer:visible, .mobile-sheet:visible");
  const supplier = drawer.getByRole("button", { name: /IPP tư nhân/i });
  const apply = drawer.getByRole("button", { name: "Áp dụng nhà cung cấp" });

  await supplier.click();
  await expect(supplier).toHaveAttribute("aria-pressed", "true");
  await expect(supplier).not.toContainText("Đang dùng");
  await expect(apply).toBeEnabled();
  await apply.click();
  await expect(supplier).toContainText("Đang dùng");

  const slider = drawer.getByRole("slider", { name: "Công suất huy động thủy điện" });
  await slider.scrollIntoViewIfNeeded();
  const value = await slider.inputValue();
  await slider.press("ArrowLeft");
  await expect(slider).not.toHaveValue(value);

  const close = drawer.getByRole("button", { name: "Đóng" });
  await expect(close).toBeInViewport({ ratio: 1 });
});

test("desktop workspace drawer fills the right edge and scrolls every panel", async ({ page }) => {
  const viewport = page.viewportSize();
  test.skip(viewport === null || viewport.width < 1181, "desktop workspace drawer only");

  await page.goto("/");
  await skipTutorial(page);
  await page.getByRole("button", { name: "Sản xuất & mua điện", exact: true }).click();

  const drawer = page.locator(".workspace-drawer");
  await expect(drawer).toHaveAttribute("data-side", "right");
  await expect(drawer).toBeVisible();

  const height = viewport?.height ?? 900;
  const width = await waitForRightDrawer(page);

  await expect
    .poll(async () => {
      const box = await drawer.boundingBox();

      return box === null ? false : Math.abs(Math.round(box.width) - Math.min(980, width)) <= 1;
    })
    .toBe(true);

  await expect
    .poll(async () => Math.round((await drawer.boundingBox())?.y ?? Number.NaN))
    .toBeLessThanOrEqual(2);
  await expect
    .poll(async () => {
      const box = await drawer.boundingBox();

      return box === null ? 0 : Math.round(box.y + box.height);
    })
    .toBeGreaterThanOrEqual(height - 2);

  const paint = await drawer.evaluate((element) => {
    const style = getComputedStyle(element);

    return {
      willChange: style.willChange,
      isolation: style.isolation,
      backgroundColor: style.backgroundColor,
      afterContent: getComputedStyle(element, "::after").content,
    };
  });

  expect(paint.willChange).toBe("auto");
  expect(paint.isolation).toBe("isolate");
  expect(paint.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(paint.afterContent).toBe("none");

  const activePanel = page.locator(".workspace-panel[data-selected]");
  await expect
    .poll(async () => activePanel.evaluate((element) => getComputedStyle(element).overflowX))
    .toBe("hidden");

  const previewHead = page.locator(".preview-head").first();
  await expect(previewHead).toBeVisible();
  expect(
    await previewHead.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);

      return hit !== null && (hit === element || element.contains(hit));
    }),
  ).toBe(true);

  const tabs = page.locator(".workspace-tabs [role='tab']");
  await expect(tabs).toHaveCount(6);

  for (let index = 0; index < 6; index += 1) {
    await tabs.nth(index).click();

    const panel = page.locator(".workspace-panel[data-selected]");
    await expect(panel).toBeVisible();
    await expect
      .poll(async () => panel.evaluate((element) => element.scrollHeight > element.clientHeight))
      .toBe(true);

    await panel.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect
      .poll(async () => panel.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
  }

  await expect(drawer.getByRole("button", { name: "Đóng" })).toBeInViewport();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);
});
