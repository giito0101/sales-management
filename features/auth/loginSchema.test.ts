import { describe, it, expect } from "vitest";
import { loginSchema } from "./loginSchema";

describe("loginSchema", () => {
  it("OK: id=1文字, password=8文字は通る（下限境界）", () => {
    const result = loginSchema.safeParse({ id: "a", password: "password" });
    expect(result.success).toBe(true);
  });

  it("OK: id=50文字は通る（上限境界）", () => {
    const id = "a".repeat(50);
    const result = loginSchema.safeParse({ id, password: "password" });
    expect(result.success).toBe(true);
  });

  it("NG: idが空文字（必須）", () => {
    const result = loginSchema.safeParse({ id: "", password: "password" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.id?.length).toBeGreaterThan(0);
    }
  });

  it("NG: idが51文字（上限超え）", () => {
    const id = "a".repeat(51);
    const result = loginSchema.safeParse({ id, password: "password" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.id?.length).toBeGreaterThan(0);
    }
  });

  it("NG: idに不正文字（例: 全角）", () => {
    const result = loginSchema.safeParse({
      id: "ａｂｃ",
      password: "password",
    });
    expect(result.success).toBe(false);
  });

  it("NG: idに不正文字（例: スペース）", () => {
    const result = loginSchema.safeParse({
      id: "user 1",
      password: "password",
    });
    expect(result.success).toBe(false);
  });

  it("NG: idに不正文字（例: @）", () => {
    const result = loginSchema.safeParse({
      id: "user@1",
      password: "password",
    });
    expect(result.success).toBe(false);
  });

  it("OK: idは英数字と - _ のみ許可", () => {
    const result = loginSchema.safeParse({
      id: "user-1_test",
      password: "password",
    });
    expect(result.success).toBe(true);
  });

  it("NG: passwordが空文字（必須）", () => {
    const result = loginSchema.safeParse({ id: "user-1", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.flatten().fieldErrors.password?.length
      ).toBeGreaterThan(0);
    }
  });

  it("NG: passwordが7文字（下限未満）", () => {
    const result = loginSchema.safeParse({ id: "user-1", password: "pass123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.flatten().fieldErrors.password?.length
      ).toBeGreaterThan(0);
    }
  });
});
