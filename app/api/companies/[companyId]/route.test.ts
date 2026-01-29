import { describe, expect, it, vi, beforeEach } from "vitest";

import { GET } from "./route";

const getServerSessionMock = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    company: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

const prismaMock = prisma as unknown as {
  company: { findFirst: ReturnType<typeof vi.fn> };
};

describe("GET /api/companies/[companyId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未認証の場合は 401 を返す", async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const res = await GET(
      new Request("http://localhost/api/companies/c-1"),
      { params: Promise.resolve({ companyId: "c-1" }) },
    );

    expect(res.status).toBe(401);
    expect(prismaMock.company.findFirst).not.toHaveBeenCalled();
  });

  it("企業が存在しない場合は 404 を返す", async () => {
    getServerSessionMock.mockResolvedValueOnce({
      user: { id: "sales-001" },
    });
    prismaMock.company.findFirst.mockResolvedValueOnce(null);

    const res = await GET(
      new Request("http://localhost/api/companies/c-1"),
      { params: Promise.resolve({ companyId: "c-1" }) },
    );

    expect(res.status).toBe(404);
    expect(prismaMock.company.findFirst).toHaveBeenCalledWith({
      where: { id: "c-1" },
      select: {
        id: true,
        name: true,
        contact: true,
        industry: true,
        staff: true,
      },
    });
  });

  it("企業詳細を返す", async () => {
    getServerSessionMock.mockResolvedValueOnce({
      user: { id: "sales-001" },
    });

    prismaMock.company.findFirst.mockResolvedValueOnce({
      id: "c-1",
      name: "Acme",
      contact: "03-0000-0000",
      industry: "IT",
      staff: "Taro",
    } as any);

    const res = await GET(
      new Request("http://localhost/api/companies/c-1"),
      { params: Promise.resolve({ companyId: "c-1" }) },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      id: "c-1",
      name: "Acme",
      contact: "03-0000-0000",
      industry: "IT",
      staff: "Taro",
    });
  });
});
