import { expect, test } from "@playwright/test";

test("serves a permissive robots.txt for the public game", async ({ request }) => {
  const response = await request.get("/robots.txt");

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/plain");

  const body = await response.text();
  expect(body).toContain("User-agent: *");
  expect(body).toContain("Allow: /");
  expect(body).not.toContain("Disallow: /");
});
