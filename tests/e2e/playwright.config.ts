import { defineConfig, devices } from "@playwright/test";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, ".env.test") });

export default defineConfig({
  testDir: __dirname,
  timeout: 240_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [
    ["html", { outputFolder: "../../playwright-report", open: "never" }],
    ["list"],
    ["json", { outputFile: "../../test-results/results.json" }],
  ],
  globalSetup: path.join(__dirname, "lib/global-setup.ts"),
  globalTeardown: path.join(__dirname, "lib/global-teardown.ts"),
  use: {
    baseURL: process.env.FRONTEND_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "e2e",
      testMatch: ["**/ui/**/*.spec.ts", "**/api/**/*.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "e2e:perf",
      testMatch: ["**/perf/**/*.spec.ts"],
      workers: 5,
      timeout: 600_000,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
