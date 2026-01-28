import { describe, expect, it, vi, beforeEach } from "vitest";

import { GET } from "./route";

const getServerSessionMock = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    jobSeekerHistory: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";

const jobSeekerHistoryFindManyMock = vi.mocked(prisma.jobSeekerHistory.findMany);

function buildRequest(url: string) {
  return new Request(url, { method: "GET" });
}

describe("GET /api/jobseekers/[id]/history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未認証の場合は 401 を返す", async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const res = await GET(
      buildRequest("http://localhost/api/jobseekers/js-1/history"),
      {
        params: Promise.resolve({ jobSeekerId: "js-1" }),
      },
    );

    expect(res.status).toBe(401);
  });

  it("不正な sort クエリは 400 を返す", async () => {
    getServerSessionMock.mockResolvedValueOnce({
      user: { id: "sales-001" },
    });

    const res = await GET(
      buildRequest("http://localhost/api/jobseekers/js-1/history?sort=invalid"),
      {
        params: Promise.resolve({ jobSeekerId: "js-1" }),
      },
    );

    expect(res.status).toBe(400);
    expect(jobSeekerHistoryFindManyMock).not.toHaveBeenCalled();
  });

  it("デフォルトは createdAt の降順で取得する", async () => {
    getServerSessionMock.mockResolvedValueOnce({
      user: { id: "sales-001" },
    });
    jobSeekerHistoryFindManyMock.mockResolvedValueOnce([]);

    const res = await GET(
      buildRequest("http://localhost/api/jobseekers/js-1/history"),
      {
        params: Promise.resolve({ jobSeekerId: "js-1" }),
      },
    );

    expect(res.status).toBe(200);
    expect(jobSeekerHistoryFindManyMock).toHaveBeenCalledWith({
      where: { jobSeekerId: "js-1" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        memo: true,
        salesUserId: true,
        salesUserName: true,
        createdAt: true,
      },
    });
  });

  it("createdAt_asc 指定時は昇順で取得する", async () => {
    getServerSessionMock.mockResolvedValueOnce({
      user: { id: "sales-001" },
    });
    jobSeekerHistoryFindManyMock.mockResolvedValueOnce([
      {
        id: "h-1",
        status: "NEW",
        memo: "note",
        salesUserId: "sales-001",
        salesUserName: "Sales User",
        createdAt: new Date("2026-01-10T00:00:00.000Z"),
      },
    ] as any);

    const res = await GET(
      buildRequest(
        "http://localhost/api/jobseekers/js-1/history?sort=createdAt_asc",
      ),
      {
        params: Promise.resolve({ jobSeekerId: "js-1" }),
      },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual([
      {
        id: "h-1",
        status: "NEW",
        memo: "note",
        salesUserId: "sales-001",
        salesUserName: "Sales User",
        createdAt: "2026-01-10T00:00:00.000Z",
      },
    ]);

    expect(jobSeekerHistoryFindManyMock).toHaveBeenCalledWith({
      where: { jobSeekerId: "js-1" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        status: true,
        memo: true,
        salesUserId: true,
        salesUserName: true,
        createdAt: true,
      },
    });
  });
});
