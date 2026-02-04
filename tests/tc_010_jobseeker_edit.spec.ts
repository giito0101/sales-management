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

test("TC-010_求職者編集（操作証跡 No=10）", async ({ page }, testInfo) => {
  const prepared = await prepareEvidence({ rowIndex: 11 });
  clearEvidencePath(prepared.row, prepared.evidencePathCol);
  registerEvidenceVideo(testInfo, prepared.evidenceDir, prepared.evidenceFile);

  // 機能: 求職者編集
  // 観点: 保存
  // 手順: No9->編集を行い保存
  // 期待結果: 求職者詳細へ遷移されデータが反映されている
  const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";
  await page.goto(`${baseUrl}/login`);
  await page.getByLabel("ID").fill(process.env.E2E_USER_ID ?? "sales-001");
  await page
    .getByLabel("パスワード")
    .fill(process.env.E2E_PASSWORD ?? "password123");
  await page.getByRole("button", { name: /ログイン/i }).click();

  await expect(page).toHaveURL(/\/jobseekers/);
  const firstLink = page.locator("table tbody a").first();
  await expect(firstLink).toBeVisible();
  await firstLink.click();

  await page.getByRole("link", { name: "編集" }).click();
  await expect(page.getByRole("heading", { name: "求職者 編集" })).toBeVisible();

  const memoText = `e2e-memo-${Date.now()}`;
  await page.locator("textarea").fill(memoText);
  await page.getByRole("button", { name: "保存" }).click();

  await expect(page).toHaveURL(/\/jobseekers\/.+\?updated=1/);
  await expect(page.getByText("更新しました。")).toBeVisible();
  await expect(
    page.locator("table").first().getByRole("row", { name: /メモ/ }),
  ).toContainText(memoText);

  // 証跡: 11行目の「証跡ファイル」を参照して保存＋Excel追記
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
