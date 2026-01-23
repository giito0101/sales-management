import { describe, it, expect } from "vitest";
import { jobSeekerCreateSchema } from "./jobSeekerCreateSchema";

const validInput = {
  name: "山田太郎",
  age: "30",
  email: "taro@example.com",
  phone: "090-1234-5678",
  desiredJobType: "営業",
  desiredLocation: "東京",
  memo: "メモ",
};

describe("jobSeekerCreateSchema", () => {
  it("OK: 必須項目が有効なら通る", () => {
    const result = jobSeekerCreateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("NG: 氏名は必須", () => {
    const result = jobSeekerCreateSchema.safeParse({
      ...validInput,
      name: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name?.[0]).toBe(
        "氏名は必須です",
      );
    }
  });

  it("NG: 氏名は100文字以内", () => {
    const result = jobSeekerCreateSchema.safeParse({
      ...validInput,
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name?.[0]).toBe(
        "氏名は100文字以内です",
      );
    }
  });

  it("OK: 年齢が未指定でも通る", () => {
    const result = jobSeekerCreateSchema.safeParse({
      ...validInput,
      age: undefined,
    });
    expect(result.success).toBe(true);
  });

  it("OK: 年齢の空文字はundefinedに変換される", () => {
    const result = jobSeekerCreateSchema.safeParse({
      ...validInput,
      age: "   ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.age).toBe(undefined);
    }
  });

  it("OK: 年齢の文字列は数値に変換される", () => {
    const result = jobSeekerCreateSchema.safeParse({
      ...validInput,
      age: " 20 ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.age).toBe(20);
    }
  });

  it("NG: 年齢は整数のみ", () => {
    const result = jobSeekerCreateSchema.safeParse({
      ...validInput,
      age: "20.5",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.age?.[0]).toBe("年齢は整数です");
    }
  });

  it("NG: 年齢は0〜120", () => {
    const result = jobSeekerCreateSchema.safeParse({
      ...validInput,
      age: 121,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.age?.[0]).toBe("年齢は0〜120です");
    }
  });

  it("NG: 年齢は数値文字列のみ", () => {
    const result = jobSeekerCreateSchema.safeParse({
      ...validInput,
      age: "abc",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.age?.[0]).toBe("年齢は整数です");
    }
  });

  it("NG: メールアドレスは必須", () => {
    const result = jobSeekerCreateSchema.safeParse({
      ...validInput,
      email: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email?.[0]).toBe(
        "メールアドレスは必須です",
      );
    }
  });

  it("NG: メールアドレス形式", () => {
    const result = jobSeekerCreateSchema.safeParse({
      ...validInput,
      email: "test@",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email?.[0]).toBe(
        "メール形式が不正です",
      );
    }
  });

  it("NG: メールアドレスは255文字以内", () => {
    const email = `${"a".repeat(256)}@example.com`;
    const result = jobSeekerCreateSchema.safeParse({
      ...validInput,
      email,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email?.[0]).toBe(
        "メールアドレスは255文字以内です",
      );
    }
  });

  it("NG: 電話番号は必須", () => {
    const result = jobSeekerCreateSchema.safeParse({
      ...validInput,
      phone: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.phone?.[0]).toBe(
        "電話番号は必須です",
      );
    }
  });

  it("NG: 電話番号は数字とハイフンのみ", () => {
    const result = jobSeekerCreateSchema.safeParse({
      ...validInput,
      phone: "090 1234",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.phone?.[0]).toBe(
        "電話番号は数字とハイフンのみです",
      );
    }
  });

  it("NG: 電話番号は20文字以内", () => {
    const result = jobSeekerCreateSchema.safeParse({
      ...validInput,
      phone: "1".repeat(21),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.phone?.[0]).toBe(
        "電話番号は20文字以内です",
      );
    }
  });

  it("NG: 希望職種は必須", () => {
    const result = jobSeekerCreateSchema.safeParse({
      ...validInput,
      desiredJobType: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.desiredJobType?.[0]).toBe(
        "希望職種は必須です",
      );
    }
  });

  it("NG: 希望職種は100文字以内", () => {
    const result = jobSeekerCreateSchema.safeParse({
      ...validInput,
      desiredJobType: "a".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.desiredJobType?.[0]).toBe(
        "希望職種は100文字以内です",
      );
    }
  });

  it("NG: 希望勤務地は必須", () => {
    const result = jobSeekerCreateSchema.safeParse({
      ...validInput,
      desiredLocation: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.desiredLocation?.[0]).toBe(
        "希望勤務地は必須です",
      );
    }
  });

  it("NG: 希望勤務地は100文字以内", () => {
    const result = jobSeekerCreateSchema.safeParse({
      ...validInput,
      desiredLocation: "a".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.desiredLocation?.[0]).toBe(
        "希望勤務地は100文字以内です",
      );
    }
  });

  it("OK: メモの空文字はundefinedに変換される", () => {
    const result = jobSeekerCreateSchema.safeParse({
      ...validInput,
      memo: "   ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.memo).toBe(undefined);
    }
  });

  it("NG: メモは2000文字以内", () => {
    const result = jobSeekerCreateSchema.safeParse({
      ...validInput,
      memo: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.memo?.[0]).toBe(
        "メモは2000文字以内です",
      );
    }
  });
});
