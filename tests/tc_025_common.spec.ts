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

test("TC-025_共通（操作証跡 No=25）", async ({ page }, testInfo) => {
  const prepared = await prepareEvidence({ rowIndex: 26 });
  clearEvidencePath(prepared.row, prepared.evidencePathCol);
  registerEvidenceVideo(testInfo, prepared.evidenceDir, prepared.evidenceFile);

  // 機能: 共通
  // 観点: 不正URL
  // 手順: 存在しないIDの詳細URLへ直接アクセス（例：/candidates/999999）
  // 期待結果: 500にならず、404またはエラーページが表示される（未ログインならログインへ誘導）
  const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";
  await page.goto(`${baseUrl}/login`);
  await page.getByLabel("ID").fill(process.env.E2E_USER_ID ?? "sales-001");
  await page
    .getByLabel("パスワード")
    .fill(process.env.E2E_PASSWORD ?? "password123");
  await page.getByRole("button", { name: /ログイン/i }).click();

  await expect(page).toHaveURL(/\/jobseekers/);

  await page.goto(`${baseUrl}/jobseekers/invalid-999999`);
  const loginCard = page.locator('[data-slot="card-title"]', {
    hasText: "ログイン",
  });
  if (await loginCard.isVisible().catch(() => false)) {
    await expect(loginCard).toBeVisible();
  } else {
    await expect(
      page.getByRole("heading", {
        name: /404|not found|could not be found/i,
      }).first(),
    ).toBeVisible();
  }

  // 証跡: 26行目の「証跡ファイル」を参照して保存＋Excel追記
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
