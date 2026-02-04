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

test("TC-026_共通（操作証跡 No=26）", async ({ page }, testInfo) => {
  const prepared = await prepareEvidence({ rowIndex: 27 });
  clearEvidencePath(prepared.row, prepared.evidencePathCol);
  registerEvidenceVideo(testInfo, prepared.evidenceDir, prepared.evidenceFile);

  // 機能: 共通
  // 観点: 多重送信
  // 手順: 求職者の新規作成または更新で、保存ボタンを連打する
  // 期待結果: 二重登録されない（1件のみ）／ローディング等で多重送信が防止される
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
  await page.getByLabel("氏名（必須）").fill(`E2E 多重 ${unique}`);
  await page.getByLabel("メールアドレス（必須）").fill(`e2e_${unique}@test.local`);
  await page.getByLabel("電話番号（必須）").fill("090-2222-3333");
  await page.getByLabel("希望職種（必須）").fill("営業");
  await page.getByLabel("希望勤務地（必須）").fill("東京");
  await page.waitForTimeout(500);

  let postCount = 0;
  const name = `E2E 多重 ${unique}`;
  page.on("request", (req) => {
    if (req.method() === "POST" && req.url().includes("/api/jobseekers")) {
      postCount += 1;
    }
  });

  const submit = page.getByRole("button", { name: "作成" });
  await submit.dblclick();
  await expect(page.getByRole("button", { name: /作成中/ })).toBeVisible();
  await page.waitForTimeout(700);
  await expect.poll(() => postCount).toBe(1);

  await page.goto(`${baseUrl}/jobseekers`);
  await expect(page.getByRole("heading", { name: "求職者一覧" })).toBeVisible();
  await page.getByPlaceholder("氏名 / メール / 電話 / 担当者で検索").fill(name);
  await page.getByRole("button", { name: "検索" }).click();
  const listRows = page
    .locator("table tbody tr")
    .filter({ hasText: name });
  await expect(listRows).toHaveCount(1);

  // 証跡: 27行目の「証跡ファイル」を参照して保存＋Excel追記
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
