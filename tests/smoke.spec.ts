import { test, expect } from "./utils/test";

test("アプリにアクセスできる（ログイン画面が表示）", async ({ page }, testInfo) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login/);
  await expect(
    page.locator('[data-slot="card-title"]', { hasText: "ログイン" })
  ).toBeVisible();
});
