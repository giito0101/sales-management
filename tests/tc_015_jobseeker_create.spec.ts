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

test("TC-015_求職者新規作成（操作証跡 No=15）", async ({ page }, testInfo) => {
  const prepared = await prepareEvidence({ rowIndex: 16 });
  clearEvidencePath(prepared.row, prepared.evidencePathCol);
  registerEvidenceVideo(testInfo, prepared.evidenceDir, prepared.evidenceFile);

  // 機能: 求職者新規作成
  // 観点: 必須
  // 手順: 必須項目を未入力して作成
  // 期待結果: 保存されずエラーが表示
  const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";
  await page.goto(`${baseUrl}/login`);
  await page.getByLabel("ID").fill(process.env.E2E_USER_ID ?? "sales-001");
  await page
    .getByLabel("パスワード")
    .fill(process.env.E2E_PASSWORD ?? "password123");
  await page.getByRole("button", { name: /ログイン/i }).click();
  await expect(page).toHaveURL(/\/jobseekers/);

  await page.goto(`${baseUrl}/jobseekers/new`);
  await expect(page.getByRole("heading", { name: "求職者 新規作成" })).toBeVisible();
  const submit = page.getByRole("button", { name: /作成/i });
  await expect(submit).toBeVisible();
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.getByText("氏名は必須です")).toBeVisible();
  await expect(page.getByText("メールアドレスは必須です")).toBeVisible();

  // 証跡: 16行目の「証跡ファイル」を参照して保存＋Excel追記
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
