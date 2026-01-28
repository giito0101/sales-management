// features/jobseekers/jobSeekerEditSchema.test.ts
import { describe, it, expect } from "vitest";
import { jobSeekerEditSchema } from "./jobSeekerEditSchema";

function basePayload() {
  return {
    name: "山田 太郎",
    age: 30,
    email: "taro@example.com",
    phone: "090-1234-5678",
    desiredJobType: "フロントエンドエンジニア",
    desiredLocation: "東京",
    memo: "メモ",
    status: "NEW",
  };
}

describe("jobSeekerEditSchema", () => {
  it("正常: 必須項目が揃っていれば通る", () => {
    const res = jobSeekerEditSchema.safeParse(basePayload());
    expect(res.success).toBe(true);
  });

  describe("バリデーション", () => {
    it("name: 空は落ちる", () => {
      const res = jobSeekerEditSchema.safeParse({
        ...basePayload(),
        name: "",
      });
      expect(res.success).toBe(false);
    });

    it("email: 形式不正は落ちる", () => {
      const res = jobSeekerEditSchema.safeParse({
        ...basePayload(),
        email: "xxx",
      });
      expect(res.success).toBe(false);
    });

    it("phone: 数字/ハイフン以外を含むと落ちる", () => {
      const res = jobSeekerEditSchema.safeParse({
        ...basePayload(),
        phone: "090-ABCD-5678",
      });
      expect(res.success).toBe(false);
    });

    it("age: 負数は落ちる", () => {
      const res = jobSeekerEditSchema.safeParse({
        ...basePayload(),
        age: -1,
      });
      expect(res.success).toBe(false);
    });
  });

  describe("境界値", () => {
    it("memo: 上限ちょうどは通る", () => {
      const res = jobSeekerEditSchema.safeParse({
        ...basePayload(),
        memo: "a".repeat(2000),
      });
      expect(res.success).toBe(true);
    });

    it("memo: 上限+1は落ちる", () => {
      const res = jobSeekerEditSchema.safeParse({
        ...basePayload(),
        memo: "a".repeat(2001),
      });
      expect(res.success).toBe(false);
    });
  });
});
