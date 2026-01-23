import { describe, expect, it, vi, beforeEach } from "vitest";

import { POST } from "./route";

const getServerSessionMock = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    jobSeeker: { create: vi.fn() },
    jobSeekerHistory: { create: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";

const prismaMock = vi.mocked(prisma);

function buildRequest(body: unknown) {
  return new Request("http://localhost/api/jobseekers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/jobseekers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未認証の場合は 401 を返す", async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const res = await POST(buildRequest({}));

    expect(res.status).toBe(401);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("期待したデータで jobSeeker を作成する", async () => {
    getServerSessionMock.mockResolvedValueOnce({
      user: { id: "user-1", name: "Sales User" },
    });

    const txMock = {
      jobSeeker: { create: vi.fn().mockResolvedValue({ id: "js-1" }) },
      jobSeekerHistory: { create: vi.fn().mockResolvedValue({ id: "h-1" }) },
    };

    prismaMock.$transaction.mockImplementationOnce(async (fn: any) => {
      return fn(txMock);
    });

    const body = {
      name: "Taro",
      age: 28,
      email: "taro@example.com",
      phone: "090-1234-5678",
      desiredJobType: "Engineer",
      desiredLocation: "Tokyo",
      memo: "note",
    };

    const res = await POST(buildRequest(body));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json).toEqual({ ok: true, id: "js-1" });
    expect(txMock.jobSeeker.create).toHaveBeenCalledWith({
      data: {
        salesUserId: "user-1",
        name: "Taro",
        age: 28,
        email: "taro@example.com",
        phone: "090-1234-5678",
        desiredJobType: "Engineer",
        desiredLocation: "Tokyo",
        memo: "note",
        status: "NEW",
      },
      select: { id: true },
    });
  });

  it("jobSeeker と履歴が同一トランザクション内で作成される", async () => {
    getServerSessionMock.mockResolvedValueOnce({
      user: { id: "user-1", name: "Sales User" },
    });

    const txMock = {
      jobSeeker: { create: vi.fn().mockResolvedValue({ id: "js-1" }) },
      jobSeekerHistory: { create: vi.fn().mockResolvedValue({ id: "h-1" }) },
    };

    prismaMock.$transaction.mockImplementationOnce(async (fn: any) => {
      return fn(txMock);
    });

    const body = {
      name: "Taro",
      age: 28,
      email: "taro@example.com",
      phone: "090-1234-5678",
      desiredJobType: "Engineer",
      desiredLocation: "Tokyo",
      memo: "note",
    };

    const res = await POST(buildRequest(body));
    expect(res.status).toBe(201);

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(txMock.jobSeeker.create).toHaveBeenCalledTimes(1);
    expect(txMock.jobSeekerHistory.create).toHaveBeenCalledTimes(1);
  });

  it("履歴作成に失敗した場合は 500 を返す", async () => {
    getServerSessionMock.mockResolvedValueOnce({
      user: { id: "user-1", name: "Sales User" },
    });

    const txMock = {
      jobSeeker: { create: vi.fn().mockResolvedValue({ id: "js-1" }) },
      jobSeekerHistory: {
        create: vi.fn().mockRejectedValue(new Error("fail")),
      },
    };

    prismaMock.$transaction.mockImplementationOnce(async (fn: any) => {
      return fn(txMock);
    });

    const body = {
      name: "Taro",
      age: 28,
      email: "taro@example.com",
      phone: "090-1234-5678",
      desiredJobType: "Engineer",
      desiredLocation: "Tokyo",
      memo: "note",
    };

    const res = await POST(buildRequest(body));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json).toEqual({
      ok: false,
      message: "Internal Server Error",
    });
  });
});
