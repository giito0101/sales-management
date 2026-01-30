import { describe, it, expect, vi, beforeEach } from "vitest";

import { PATCH } from "./route.patch";

const prismaMock = vi.hoisted(() => ({
  company: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

const getServerSessionMock = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

function makeReq(body: unknown) {
  return {
    json: async () => body,
  } as any;
}

function basePayload() {
  return {
    name: "株式会社サンプル",
    contact: "sample@example.com",
    industry: "IT",
    staff: "山田 太郎",
  };
}

describe("PATCH /api/companies/[companyId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue({ user: { id: "sales-1" } });
    prismaMock.company.findFirst.mockResolvedValue({ id: "c-1" });
    prismaMock.company.update.mockResolvedValue({ id: "c-1" });
  });

  it("認証なしで 401 を返す（DBは呼ばれない）", async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const res = await PATCH(makeReq(basePayload()), {
      params: Promise.resolve({ companyId: "c-1" }),
    });

    expect(res.status).toBe(401);
    expect(prismaMock.company.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.company.update).not.toHaveBeenCalled();
  });

  it("対象企業が存在せず 404 を返す", async () => {
    prismaMock.company.findFirst.mockResolvedValueOnce(null);

    const res = await PATCH(makeReq(basePayload()), {
      params: Promise.resolve({ companyId: "c-1" }),
    });

    expect(res.status).toBe(404);
    expect(prismaMock.company.update).not.toHaveBeenCalled();
  });

  it("バリデーションエラーで 400 を返す（issues を返す）", async () => {
    const res = await PATCH(
      makeReq({ ...basePayload(), name: "" }),
      {
        params: Promise.resolve({ companyId: "c-1" }),
      },
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      message: "Validation error",
      issues: expect.any(Array),
    });
  });

  it("正常更新で 200 を返し、更新値が保存される", async () => {
    const payload = { ...basePayload(), contact: "" };

    const res = await PATCH(makeReq(payload), {
      params: Promise.resolve({ companyId: "c-1" }),
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      message: "企業情報を更新しました",
    });

    expect(prismaMock.company.update).toHaveBeenCalledWith({
      where: { id: "c-1" },
      data: {
        name: payload.name,
        contact: payload.contact,
        industry: payload.industry,
        staff: payload.staff,
      },
    });
  });

  it("更新時にDBエラーが発生した場合 500 を返す", async () => {
    prismaMock.company.update.mockRejectedValueOnce(new Error("boom"));

    const res = await PATCH(makeReq(basePayload()), {
      params: Promise.resolve({ companyId: "c-1" }),
    });

    expect(res.status).toBe(500);
  });
});
