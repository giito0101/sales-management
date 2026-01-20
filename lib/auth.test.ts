import { describe, it, expect, vi, beforeEach } from "vitest";
import { authorizeCredentials } from "./auth";

// prisma と bcryptjs をモック
vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      salesUser: {
        findUnique: vi.fn(),
      },
    },
  };
});

vi.mock("bcryptjs", () => {
  return {
    compare: vi.fn(),
  };
});

import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

describe("authorizeCredentials", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("credentials欠け: credentialsがundefinedならnull", async () => {
    const result = await authorizeCredentials(undefined);
    expect(result).toBeNull();
    expect(prisma.salesUser.findUnique).not.toHaveBeenCalled();
  });

  it("credentials欠け: idが空ならnull", async () => {
    const result = await authorizeCredentials({ id: "", password: "password" });
    expect(result).toBeNull();
    expect(prisma.salesUser.findUnique).not.toHaveBeenCalled();
  });

  it("credentials欠け: passwordが空ならnull", async () => {
    const result = await authorizeCredentials({ id: "user-1", password: "" });
    expect(result).toBeNull();
    expect(prisma.salesUser.findUnique).not.toHaveBeenCalled();
  });

  it("not found: ユーザーが見つからないならnull", async () => {
    (prisma.salesUser.findUnique as any).mockResolvedValue(null);

    const result = await authorizeCredentials({
      id: "user-1",
      password: "password",
    });

    expect(prisma.salesUser.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { id: true, name: true, password: true, isActive: true },
    });
    expect(result).toBeNull();
  });

  it("inactive: isActive=falseならnull", async () => {
    (prisma.salesUser.findUnique as any).mockResolvedValue({
      id: "user-1",
      name: "Taro",
      password: "hashed",
      isActive: false,
    });

    const result = await authorizeCredentials({
      id: "user-1",
      password: "password",
    });

    expect(result).toBeNull();
    expect(compare).not.toHaveBeenCalled();
  });

  it("mismatch: compare=falseならnull", async () => {
    (prisma.salesUser.findUnique as any).mockResolvedValue({
      id: "user-1",
      name: "Taro",
      password: "hashed",
      isActive: true,
    });
    (compare as any).mockResolvedValue(false);

    const result = await authorizeCredentials({
      id: "user-1",
      password: "wrongpass",
    });

    expect(compare).toHaveBeenCalledWith("wrongpass", "hashed");
    expect(result).toBeNull();
  });

  it("ok: compare=trueならユーザーを返す（passwordは含めない）", async () => {
    (prisma.salesUser.findUnique as any).mockResolvedValue({
      id: "user-1",
      name: "Taro",
      password: "hashed",
      isActive: true,
    });
    (compare as any).mockResolvedValue(true);

    const result = await authorizeCredentials({
      id: "user-1",
      password: "password",
    });

    expect(result).toEqual({ id: "user-1", name: "Taro" });
    // password が戻り値に含まれていないこと
    expect((result as any)?.password).toBeUndefined();
  });
});
