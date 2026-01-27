import { describe, expect, it, vi, beforeEach } from "vitest";

import { GET } from "./route";

const getServerSessionMock = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

// prisma を import するより先に mock を宣言（※重要）
vi.mock("@/lib/prisma", () => ({
  prisma: {
    jobSeeker: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

const findFirstMock = vi.mocked(prisma.jobSeeker.findFirst);

const prismaMock = vi.mocked(prisma);

describe("GET /api/jobseekers/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未認証の場合は 401 を返す", async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const res = await GET(new Request("http://localhost/api/jobseekers/js-1"), {
      params: Promise.resolve({ id: "js-1" }),
    });

    expect(res.status).toBe(401);
    expect(prismaMock.jobSeeker.findFirst).not.toHaveBeenCalled();
  });

  it("担当者の求職者が存在しない場合は 404 を返す", async () => {
    getServerSessionMock.mockResolvedValueOnce({
      user: { id: "sales-001", name: "Sales User" },
    });
    findFirstMock.mockResolvedValueOnce(null);

    const res = await GET(new Request("http://localhost/api/jobseekers/js-1"), {
      params: Promise.resolve({ id: "js-1" }),
    });

    expect(res.status).toBe(404);
    expect(prismaMock.jobSeeker.findFirst).toHaveBeenCalledWith({
      where: { id: "js-1", salesUserId: "sales-001" },
      select: {
        id: true,
        name: true,
        age: true,
        email: true,
        phone: true,
        desiredJobType: true,
        desiredLocation: true,
        status: true,
        updatedAt: true,
        memo: true,
        salesUser: { select: { name: true } },
      },
    });
  });

  it("担当者の求職者詳細を返す", async () => {
    getServerSessionMock.mockResolvedValueOnce({
      user: { id: "sales-001", name: "Sales User" },
    });

    findFirstMock.mockResolvedValueOnce({
      id: "js-1",
      name: "Taro",
      age: 28,
      email: "taro@example.com",
      phone: "090-1234-5678",
      desiredJobType: "Engineer",
      desiredLocation: "Tokyo",
      status: "NEW",
      updatedAt: new Date("2026-01-20T10:00:00.000Z"),
      memo: "note",
      salesUser: { name: "Sales User" },
    } as any);

    const res = await GET(new Request("http://localhost/api/jobseekers/js-1"), {
      params: Promise.resolve({ id: "js-1" }),
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      id: "js-1",
      name: "Taro",
      age: 28,
      email: "taro@example.com",
      phone: "090-1234-5678",
      desiredJobType: "Engineer",
      desiredLocation: "Tokyo",
      status: "NEW",
      updatedAt: "2026-01-20T10:00:00.000Z",
      memo: "note",
      salesUserName: "Sales User",
    });
  });
});
