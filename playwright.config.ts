import { defineConfig, devices } from "@playwright/test";

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const port = process.env.PLAYWRIGHT_PORT ?? "3000";
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 45_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: {
      executablePath,
      args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
    },
  },
  webServer: {
    command: `pnpm dev --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "tablet",
      use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 }, hasTouch: true },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
    {
      name: "narrow",
      use: { ...devices["Pixel 7"], viewport: { width: 360, height: 740 } },
    },
  ],
});
