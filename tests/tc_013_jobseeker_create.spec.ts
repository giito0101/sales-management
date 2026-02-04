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

test("TC-013_求職者新規作成（操作証跡 No=13）", async ({ page }, testInfo) => {
  const prepared = await prepareEvidence({ rowIndex: 14 });
  clearEvidencePath(prepared.row, prepared.evidencePathCol);
  registerEvidenceVideo(testInfo, prepared.evidenceDir, prepared.evidenceFile);

  // 機能: 求職者新規作成
  // 観点: 保存
  // 手順: 必須項目を入力して作成
  // 期待結果: 作成したメッセージが確認できる
  const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";
  await page.goto(`${baseUrl}/login`);
  await page.getByLabel("ID").fill(process.env.E2E_USER_ID ?? "sales-001");
  await page
    .getByLabel("パスワード")
    .fill(process.env.E2E_PASSWORD ?? "password123");
  await page.getByRole("button", { name: /ログイン/i }).click();

  await expect(page).toHaveURL(/\/jobseekers/);

  await page.goto(`${baseUrl}/jobseekers/new`);
  const unique = Date.now();
  await page.getByLabel("氏名（必須）").fill(`E2E 求職者 ${unique}`);
  await page.getByLabel("メールアドレス（必須）").fill(`e2e_${unique}@test.local`);
  await page.getByLabel("電話番号（必須）").fill("090-0000-0000");
  await page.getByLabel("希望職種（必須）").fill("営業");
  await page.getByLabel("希望勤務地（必須）").fill("東京");
  await page.getByRole("button", { name: "作成" }).click();

  await expect(page.getByText("作成しました。")).toBeVisible();

  // 証跡: 14行目の「証跡ファイル」を参照して保存＋Excel追記
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
