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

test("TC-022_求職者履歴（操作証跡 No=22）", async ({ page }, testInfo) => {
  const prepared = await prepareEvidence({ rowIndex: 23 });
  clearEvidencePath(prepared.row, prepared.evidencePathCol);
  registerEvidenceVideo(testInfo, prepared.evidenceDir, prepared.evidenceFile);

  // 機能: 求職者履歴
  // 観点: 保存
  // 手順: No9->メモを変更し保存
  // 期待結果: メモ更新時に履歴が自動保存される
  const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";
  await page.goto(`${baseUrl}/login`);
  await page.getByLabel("ID").fill(process.env.E2E_USER_ID ?? "sales-001");
  await page
    .getByLabel("パスワード")
    .fill(process.env.E2E_PASSWORD ?? "password123");
  await page.getByRole("button", { name: /ログイン/i }).click();

  await expect(page).toHaveURL(/\/jobseekers/);

  await page.goto(`${baseUrl}/jobseekers`);
  const firstLink = page.locator("table tbody a").first();
  await expect(firstLink).toBeVisible();
  await firstLink.click();
  await page.getByRole("link", { name: "編集" }).click();

  const memoText = `e2e-history-memo-${Date.now()}`;
  await page.locator("textarea").fill(memoText);
  await page.getByRole("button", { name: "保存" }).click();

  await expect(page.getByText("更新しました。")).toBeVisible();
  await expect(page.locator("table").nth(1).getByText(memoText)).toBeVisible();

  // 証跡: 23行目の「証跡ファイル」を参照して保存＋Excel追記
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
