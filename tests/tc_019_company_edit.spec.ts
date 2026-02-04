import { test, expect } from "./utils/test";
import path from "node:path";
import {
  appendEvidencePath,
  clearEvidencePath,
  captureEvidenceScreenshot,
  registerEvidenceVideo,
  finalizeEvidence,
  prepareEvidence,
} from "./utils/evidence";

test("TC-019_企業編集（操作証跡 No=19）", async ({ page }, testInfo) => {
  const prepared = await prepareEvidence({ rowIndex: 20 });
  clearEvidencePath(prepared.row, prepared.evidencePathCol);
  registerEvidenceVideo(testInfo, prepared.evidenceDir, prepared.evidenceFile);

  // 機能: 企業編集
  // 観点: 保存
  // 手順: No18->編集を行い保存
  // 期待結果: 企業詳細へ遷移されデータが反映されている
  const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";
  await page.goto(`${baseUrl}/login`);
  await page.getByLabel("ID").fill(process.env.E2E_USER_ID ?? "sales-001");
  await page
    .getByLabel("パスワード")
    .fill(process.env.E2E_PASSWORD ?? "password123");
  await page.getByRole("button", { name: /ログイン/i }).click();

  await expect(page).toHaveURL(/\/jobseekers/);

  await page.goto(`${baseUrl}/companies`);
  const firstLink = page.locator("table tbody a").first();
  await expect(firstLink).toBeVisible();
  await firstLink.click();

  await page.getByRole("link", { name: "編集" }).click();
  await expect(page.getByRole("heading", { name: "企業編集" })).toBeVisible();

  const updatedName = `E2E 企業 ${Date.now()}`;
  await page.getByLabel("企業名（必須）").fill(updatedName);
  await page.getByRole("button", { name: "保存" }).click();

  await expect(page).toHaveURL(/\/companies\/.+\?updated=1/);
  await expect(page.getByText("更新しました。")).toBeVisible();
  await expect(page.getByRole("row", { name: /企業名/ })).toContainText(updatedName);

  // 証跡: 20行目の「証跡ファイル」を参照して保存＋Excel追記
  if (prepared.evidenceFile.endsWith(".mp4")) {
    appendEvidencePath(
      prepared.row,
      prepared.evidencePathCol,
      path.posix.join("evidence", prepared.date, prepared.env, "操作証跡",
        prepared.evidenceFile,
      ),
    );
  } else {
    await captureEvidenceScreenshot(
      page,
      prepared.evidenceDir,
      prepared.evidenceFile,
    );
    appendEvidencePath(
      prepared.row,
      prepared.evidencePathCol,
      path.posix.join("evidence", prepared.date, prepared.env, "操作証跡",
        prepared.evidenceFile,
      ),
    );
  }

  await finalizeEvidence(prepared.workbook, prepared.workbookPath);
});
