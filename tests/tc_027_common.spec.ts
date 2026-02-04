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

test("TC-027_共通（操作証跡 No=27）", async ({ page }, testInfo) => {
  const prepared = await prepareEvidence({ rowIndex: 28 });
  clearEvidencePath(prepared.row, prepared.evidencePathCol);
  registerEvidenceVideo(testInfo, prepared.evidenceDir, prepared.evidenceFile);

  // 機能: 共通
  // 観点: 通信エラー
  // 手順: DevToolsでOfflineにして保存を試行する（作成/更新どちらでも可）
  // 期待結果: エラーメッセージが表示され、画面が壊れず再操作できる（白画面にならない）
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
  await page.getByLabel("氏名（必須）").fill(`E2E 通信 ${unique}`);
  await page.getByLabel("メールアドレス（必須）").fill(`e2e_${unique}@test.local`);
  await page.getByLabel("電話番号（必須）").fill("090-3333-4444");
  await page.getByLabel("希望職種（必須）").fill("営業");
  await page.getByLabel("希望勤務地（必須）").fill("福岡");

  await page.route("**/api/jobseekers", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "通信エラー" }),
    });
  });
  await page.getByRole("button", { name: "作成" }).click();
  await expect(page.getByText("通信エラー")).toBeVisible();
  await expect(page.getByRole("button", { name: "作成" })).toBeVisible();

  // 証跡: 28行目の「証跡ファイル」を参照して保存＋Excel追記
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
