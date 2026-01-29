import { describe, expect, it, vi, beforeEach } from "vitest";

import { GET } from "./route";

const getServerSessionMock = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    company: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";

const prismaMock = prisma as unknown as {
  company: { findMany: ReturnType<typeof vi.fn> };
};

function buildRequest(url: string) {
  return new Request(url, { method: "GET" });
}

describe("GET /api/companies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未認証の場合は 401 を返す", async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const res = await GET(buildRequest("http://localhost/api/companies"));

    expect(res.status).toBe(401);
    expect(prismaMock.company.findMany).not.toHaveBeenCalled();
  });

  it("不正な検索パラメータの場合は 400 を返す", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "sales-001" } });

    const longQuery = "a".repeat(256);
    const res = await GET(
      buildRequest(`http://localhost/api/companies?q=${longQuery}`),
    );

    expect(res.status).toBe(400);
    expect(prismaMock.company.findMany).not.toHaveBeenCalled();
  });

  it("検索と並び替え条件で企業一覧を取得する", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "sales-001" } });

    prismaMock.company.findMany.mockResolvedValueOnce([
      {
        id: "c-1",
        name: "Acme",
        contact: "03-0000-0000",
        industry: "IT",
        staff: "Taro",
      },
    ] as any);

    const res = await GET(
      buildRequest(
        "http://localhost/api/companies?q=acme&sortKey=name&sortOrder=desc",
      ),
    );

    expect(res.status).toBe(200);
    expect(prismaMock.company.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { name: { contains: "acme", mode: "insensitive" } },
          { contact: { contains: "acme", mode: "insensitive" } },
          { industry: { contains: "acme", mode: "insensitive" } },
          { staff: { contains: "acme", mode: "insensitive" } },
        ],
      },
      orderBy: { name: "desc" },
      select: {
        id: true,
        name: true,
        contact: true,
        industry: true,
        staff: true,
      },
      take: 200,
    });

    const json = await res.json();
    expect(json).toEqual({
      companies: [
        {
          id: "c-1",
          name: "Acme",
          contact: "03-0000-0000",
          industry: "IT",
          staff: "Taro",
        },
      ],
    });
  });

  it("q 未指定のときは全件対象で id 昇順になる", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "sales-001" } });

    prismaMock.company.findMany.mockResolvedValueOnce([] as any);

    const res = await GET(buildRequest("http://localhost/api/companies"));

    expect(res.status).toBe(200);
    expect(prismaMock.company.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        contact: true,
        industry: true,
        staff: true,
      },
      take: 200,
    });
  });
});
