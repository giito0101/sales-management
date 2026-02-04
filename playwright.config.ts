import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  reporter: [["html", { open: "never" }]],
  workers: 1,

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    video: "on",
  },

  // ✅ 追加：テスト実行時にアプリを自動起動
  webServer: {
    // 安定重視なら "build -> start" 推奨（後述の start:e2e を作る）
    command: "npm run start:e2e",
    url: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI, // CI/Codexでは毎回起動、ローカルは再利用OK
    timeout: 120_000,
  },

  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
