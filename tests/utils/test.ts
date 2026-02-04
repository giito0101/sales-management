import { test as base, expect } from "@playwright/test";
import { saveEvidenceVideoFromTestInfo } from "./evidence";

const test = base;

test.afterEach(async ({ page }, testInfo) => {
  await saveEvidenceVideoFromTestInfo(page, testInfo);
});

export { test, expect };
