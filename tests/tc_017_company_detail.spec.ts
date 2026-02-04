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

test("TC-017_企業詳細（操作証跡 No=17）", async ({ page }, testInfo) => {
  const prepared = await prepareEvidence({ rowIndex: 18 });
  clearEvidencePath(prepared.row, prepared.evidencePathCol);
  registerEvidenceVideo(testInfo, prepared.evidenceDir, prepared.evidenceFile);

  // 機能: 企業詳細
  // 観点: 正常系
  // 手順: No16->企業一覧で、存在するIDをクリック
  // 期待結果: 企業詳細へ遷移
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

  await expect(page.getByRole("heading", { name: "企業詳細" })).toBeVisible();

  // 証跡: 18行目の「証跡ファイル」を参照して保存＋Excel追記
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
