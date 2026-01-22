import { describe, it, expect } from "vitest";
import { jobSeekerSearchParamsSchema } from "./searchSchema";

describe("jobSeekerSearchSchema", () => {
  it("OK: 空文字でも通る", () => {
    const result = jobSeekerSearchParamsSchema.safeParse({ q: "" });
    expect(result.success).toBe(true);
  });

  it("OK: 255文字は通る（上限境界）", () => {
    const q = "a".repeat(255);
    const result = jobSeekerSearchParamsSchema.safeParse({ q });
    expect(result.success).toBe(true);
  });

  it("NG: 256文字は通らない", () => {
    const q = "a".repeat(256);
    const result = jobSeekerSearchParamsSchema.safeParse({ q });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.q?.[0]).toBe(
        "検索ワードが適切ではありません",
      );
    }
  });
});
