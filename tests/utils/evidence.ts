import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import type { Page, TestInfo } from "@playwright/test";

function yyyymmdd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function cellText(value: ExcelJS.CellValue) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object" && "text" in value && value.text) {
    return String(value.text);
  }
  return String(value);
}

function findHeaderColumn(
  ws: ExcelJS.Worksheet,
  header: string,
  headerRow = 1,
) {
  const row = ws.getRow(headerRow);
  for (let c = 1; c <= ws.columnCount; c += 1) {
    const value = cellText(row.getCell(c).value);
    if (value === header) return c;
  }
  return null;
}

export type PrepareEvidenceOptions = {
  rowIndex: number;
  env?: string;
  date?: string;
  workbookPath?: string;
  sheetName?: string;
};

export type PreparedEvidence = {
  workbookPath: string;
  workbook: ExcelJS.Workbook;
  worksheet: ExcelJS.Worksheet;
  row: ExcelJS.Row;
  evidencePathCol: number;
  evidenceFile: string;
  evidenceDir: string;
  env: string;
  date: string;
};

export async function prepareEvidence({
  rowIndex,
  env = process.env.E2E_ENV ?? "local",
  date = yyyymmdd(),
  workbookPath = path.join(
    process.cwd(),
    "docs",
    "納品_証跡フォーマット_v3.xlsx",
  ),
  sheetName = "操作証跡",
}: PrepareEvidenceOptions): Promise<PreparedEvidence> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(workbookPath);
  const ws = wb.getWorksheet(sheetName);
  if (!ws) {
    throw new Error(`Worksheet not found: ${sheetName}`);
  }

  const evidenceFileCol = findHeaderColumn(ws, "証跡ファイル");
  const evidencePathCol = findHeaderColumn(ws, "証跡パス(URL/Path)");
  if (!evidenceFileCol || !evidencePathCol) {
    throw new Error("Required headers not found in 操作証跡 sheet");
  }

  const row = ws.getRow(rowIndex);
  const evidenceFile = cellText(row.getCell(evidenceFileCol).value);
  if (!evidenceFile) {
    throw new Error(`証跡ファイル is empty at row ${rowIndex}`);
  }

  const evidenceDir = path.join(
    process.cwd(),
    "evidence",
    date,
    env,
    "操作証跡",
  );
  fs.mkdirSync(evidenceDir, { recursive: true });

  return {
    workbookPath,
    workbook: wb,
    worksheet: ws,
    row,
    evidencePathCol,
    evidenceFile,
    evidenceDir,
    env,
    date,
  };
}

export function withSuffix(filename: string, suffix: string) {
  const ext = path.extname(filename);
  const base = ext ? filename.slice(0, -ext.length) : filename;
  return `${base}${suffix}${ext}`;
}

export async function captureEvidenceScreenshot(
  page: Page,
  evidenceDir: string,
  evidenceFile: string,
) {
  if (path.basename(evidenceFile) === "cap_01_input.png") return null;
  const ext = path.extname(evidenceFile).toLowerCase();
  if (![".png", ".jpg", ".jpeg"].includes(ext)) return null;
  const evidencePath = path.join(evidenceDir, evidenceFile);
  await page.screenshot({ path: evidencePath, fullPage: true });
  return evidencePath;
}

export async function captureEvidenceVideo(
  page: Page,
  evidenceDir: string,
  evidenceFile: string,
) {
  const video = page.video();
  if (!video) return null;
  try {
    if (!page.isClosed()) {
      await page.close();
    }
  } catch {
    // Ignore close errors; video path may still be available.
  }
  const videoPath = await video.path();
  const ext = path.extname(evidenceFile);
  const targetFile =
    ext.toLowerCase() === ".mp4"
      ? `${path.basename(evidenceFile, ext)}.webm`
      : evidenceFile;
  const evidencePath = path.join(evidenceDir, targetFile);
  await fs.promises.copyFile(videoPath, evidencePath);
  return evidencePath;
}

export function appendEvidencePath(
  row: ExcelJS.Row,
  evidencePathCol: number,
  evidenceRelPath: string,
) {
  if (path.basename(evidenceRelPath) === "cap_01_input.png") return;
  const normalizedPath = evidenceRelPath.endsWith(".mp4")
    ? `${evidenceRelPath.slice(0, -4)}.webm`
    : evidenceRelPath;
  const cell = row.getCell(evidencePathCol);
  const current = cellText(cell.value);
  cell.value = current ? `${current}\n${normalizedPath}` : normalizedPath;
  cell.alignment = { wrapText: true, vertical: "top" };
  const lines = String(cell.value).split(/\r?\n/).length;
  row.height = Math.max(row.height ?? 0, 15 * lines);
  row.commit();
}

export function clearEvidencePath(row: ExcelJS.Row, evidencePathCol: number) {
  const cell = row.getCell(evidencePathCol);
  cell.value = "";
  cell.alignment = { wrapText: true, vertical: "top" };
  row.commit();
}

export function registerEvidenceVideo(
  testInfo: TestInfo,
  evidenceDir: string,
  evidenceFile: string,
) {
  const ext = path.extname(evidenceFile).toLowerCase();
  if (ext !== ".mp4" && ext !== ".webm") return;
  testInfo.annotations.push({
    type: "evidence-video",
    description: JSON.stringify({ evidenceDir, evidenceFile }),
  });
}

export async function saveEvidenceVideoFromTestInfo(
  page: Page,
  testInfo: TestInfo,
) {
  const annotation = testInfo.annotations.find(
    (entry) => entry.type === "evidence-video",
  );
  if (!annotation?.description) return null;
  let payload: { evidenceDir: string; evidenceFile: string } | null = null;
  try {
    payload = JSON.parse(annotation.description);
  } catch {
    return null;
  }
  if (!payload) return null;

  const attachment = testInfo.attachments.find((item) =>
    item.contentType?.startsWith("video/"),
  );
  let videoPath = attachment?.path ?? null;

  if (!videoPath) {
    const video = page.video();
    if (!video) return null;
    try {
      await page.context().close();
    } catch {
      // Ignore close errors; video path may still be available.
    }
    videoPath = await video.path();
  }
  const ext = path.extname(payload.evidenceFile);
  const targetFile =
    ext.toLowerCase() === ".mp4"
      ? `${path.basename(payload.evidenceFile, ext)}.webm`
      : payload.evidenceFile;
  const evidencePath = path.join(payload.evidenceDir, targetFile);
  await fs.promises.copyFile(videoPath, evidencePath);
  return evidencePath;
}

export async function finalizeEvidence(
  workbook: ExcelJS.Workbook,
  workbookPath: string,
) {
  await workbook.xlsx.writeFile(workbookPath);
}
