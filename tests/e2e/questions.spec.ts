import { expect, test } from "@playwright/test";

test("opens the Vietnamese quiz, scores ten answers and starts over", async ({ page }) => {
  const response = await page.goto("/questions");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Câu hỏi trắc nghiệm" })).toBeVisible();
  await expect(page.getByRole("group")).toHaveCount(10);
  await expect(page.getByRole("radio")).toHaveCount(40);

  await page.getByRole("link", { name: "Về trò chơi" }).click();
  await expect(page).toHaveURL("/");
  await page.getByRole("link", { name: "Câu hỏi trắc nghiệm" }).click();
  await expect(page).toHaveURL("/questions");

  const groups = page.getByRole("group");
  const submit = page.getByRole("button", { name: "Nộp bài" });

  await submit.click();
  await expect(groups.first().getByRole("radio").first()).toBeFocused();
  await expect(page.getByText("Kết quả ·", { exact: false })).toHaveCount(0);

  const choices = [0, 1, 0, 3, 1, 2, 3, 1, 0, 2];

  for (const [index, choice] of choices.entries()) {
    await groups.nth(index).getByRole("radio").nth(choice).check();
  }

  const progress = page.getByRole("progressbar", { name: "Tiến độ trả lời" });
  await expect(progress).toHaveAttribute("value", "10");
  await submit.click();
  await expect(page.getByText("Kết quả · 9/10 câu đúng")).toBeVisible();
  await expect(groups.first().getByText("Đáp án đúng · C")).toBeVisible();
  await expect(groups.first().getByText(/Khống chế trần giá bán lẻ là/)).toBeVisible();

  const viewportFits = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );

  expect(viewportFits).toBe(true);
  await page.getByRole("button", { name: "Làm lại" }).click();
  await expect(progress).toHaveAttribute("value", "0");
  await expect(groups.first().getByRole("radio").first()).toBeFocused();
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
});
