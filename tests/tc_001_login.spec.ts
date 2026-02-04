import { test, expect } from "./utils/test";
import path from "node:path";
import {
  appendEvidencePath,
  clearEvidencePath,
  captureEvidenceScreenshot,
  registerEvidenceVideo,
  finalizeEvidence,
  prepareEvidence,
  withSuffix,
} from "./utils/evidence";

test("TC-001_login（操作証跡 No=1）", async ({ page }, testInfo) => {
  const prepared = await prepareEvidence({ rowIndex: 2 });
  clearEvidencePath(prepared.row, prepared.evidencePathCol);
  registerEvidenceVideo(testInfo, prepared.evidenceDir, prepared.evidenceFile);

  // 手順：正しいID/Passでログイン
  await page.goto(process.env.E2E_BASE_URL ?? "http://localhost:3000/login");
  await page.getByLabel("ID").fill(process.env.E2E_USER_ID ?? "sales-001");
  await page
    .getByLabel("パスワード")
    .fill(process.env.E2E_PASSWORD ?? "password123");

  // 証跡：入力後の画面（2行目の「証跡パス(URL/Path)」に追記）
  const inputEvidenceFile = withSuffix(prepared.evidenceFile, "_input");
  await captureEvidenceScreenshot(
    page,
    prepared.evidenceDir,
    inputEvidenceFile,
  );
  appendEvidencePath(
    prepared.row,
    prepared.evidencePathCol,
    path.posix.join("evidence", prepared.date, prepared.env, "操作証跡", inputEvidenceFile),
  );

  await page.getByRole("button", { name: /ログイン/i }).click();

  // 期待結果：求職者一覧へ遷移
  await expect(page).toHaveURL(/\/jobseekers/);

  // 証跡：2行目の「証跡ファイル」を参照して保存＋Excel追記
  await captureEvidenceScreenshot(
    page,
    prepared.evidenceDir,
    prepared.evidenceFile,
  );
  appendEvidencePath(
    prepared.row,
    prepared.evidencePathCol,
    path.posix.join("evidence", prepared.date, prepared.env, "操作証跡", prepared.evidenceFile),
  );

  await finalizeEvidence(prepared.workbook, prepared.workbookPath);
});
