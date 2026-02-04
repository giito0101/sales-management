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

test("TC-002_ログイン（操作証跡 No=2）", async ({ page }, testInfo) => {
  const prepared = await prepareEvidence({ rowIndex: 3 });
  clearEvidencePath(prepared.row, prepared.evidencePathCol);
  registerEvidenceVideo(testInfo, prepared.evidenceDir, prepared.evidenceFile);

  // 機能: ログイン
  // 観点: 未ログイン
  // 手順: 未ログインで、保護ページへアクセス
  // 期待結果: ログインへ遷移
  await page.context().clearCookies();
  await page.goto(
    `${process.env.E2E_BASE_URL ?? "http://localhost:3000"}/jobseekers`,
    { waitUntil: "domcontentloaded" },
  );

  await expect(page).toHaveURL(/\/login(\?|$)/);
  await expect(
    page.locator('[data-slot="card-title"]', { hasText: "ログイン" }),
  ).toBeVisible();
  await expect(page.getByLabel("ID")).toBeVisible();
  await expect(page.getByLabel("パスワード")).toBeVisible();
  await expect(page.getByRole("button", { name: /ログイン/i })).toBeVisible();

  // 証跡: 3行目の「証跡ファイル」を参照して保存＋Excel追記
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
