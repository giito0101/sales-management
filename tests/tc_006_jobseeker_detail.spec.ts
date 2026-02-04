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

test("TC-006_求職者詳細（操作証跡 No=6）", async ({ page }, testInfo) => {
  const prepared = await prepareEvidence({ rowIndex: 7 });
  clearEvidencePath(prepared.row, prepared.evidencePathCol);
  registerEvidenceVideo(testInfo, prepared.evidenceDir, prepared.evidenceFile);

  // 機能: 求職者詳細
  // 観点: 正常系
  // 手順: No5->求職者詳細で、ステータスを確認
  // 期待結果: ステータスの現在値を表示
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

  await expect(page.getByRole("heading", { name: "求職者 詳細" })).toBeVisible();
  const statusRow = page
    .locator("table")
    .first()
    .getByRole("row", { name: /ステータス/ });
  await expect(statusRow).toBeVisible();
  await expect(statusRow).toContainText(/新規|面談済|提案中|内定|終了/);

  // 証跡: 7行目の「証跡ファイル」を参照して保存＋Excel追記
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
