vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import JobSeekerDetailPage from "./page";
import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";

const getServerSessionMock = vi.mocked(getServerSession);
const cookiesMock = vi.mocked(cookies);
const headersMock = vi.mocked(headers);
const redirectMock = vi.mocked(redirect);
const notFoundMock = vi.mocked(notFound);

describe("JobSeekerDetailPage", () => {
  beforeEach(() => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "sales-001" },
    } as any);
    cookiesMock.mockResolvedValue({ getAll: () => [] } as any);
    headersMock.mockResolvedValue({
      get: (key: string) => {
        if (key === "x-forwarded-host") return "localhost";
        if (key === "x-forwarded-proto") return "http";
        return null;
      },
    } as any);
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it("未認証の場合はログインへリダイレクトする", async () => {
    getServerSessionMock.mockResolvedValueOnce(null);
    redirectMock.mockImplementation(() => {
      throw new Error("redirected");
    });

    await expect(
      JobSeekerDetailPage({
        params: Promise.resolve({ jobSeekerId: "js-1" }),
      }),
    ).rejects.toThrow("redirected");

    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("詳細と履歴を取得し、履歴は createdAt_desc で取得する", async () => {
    const detail = {
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
    };

    const history = [
      {
        id: "h-1",
        status: "NEW",
        memo: "note",
        salesUserId: "sales-001",
        salesUserName: "Sales User",
        createdAt: "2026-01-20T10:00:00.000Z",
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(detail),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(history),
      });

    await JobSeekerDetailPage({
      params: Promise.resolve({ jobSeekerId: "js-1" }),
      searchParams: Promise.resolve({}),
    });

    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const detailUrl = fetchMock.mock.calls[0][0] as string;
    const historyUrl = fetchMock.mock.calls[1][0] as string;
    const detailParams = new URL(
      detailUrl,
      "http://localhost",
    ).searchParams;
    const historyParams = new URL(
      historyUrl,
      "http://localhost",
    ).searchParams;

    expect(detailParams.get("sort")).toBeNull();
    expect(historyParams.get("sort")).toBe("createdAt_desc");
  });

  it("sort=createdAt_asc 指定時は昇順で取得する", async () => {
    const detail = {
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
    };

    const history = [
      {
        id: "h-1",
        status: "NEW",
        memo: "note",
        salesUserId: "sales-001",
        salesUserName: "Sales User",
        createdAt: "2026-01-20T10:00:00.000Z",
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(detail),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(history),
      });

    await JobSeekerDetailPage({
      params: Promise.resolve({ jobSeekerId: "js-1" }),
      searchParams: Promise.resolve({ sort: "createdAt_asc" }),
    });

    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const historyUrl = fetchMock.mock.calls[1][0] as string;
    const historyParams = new URL(
      historyUrl,
      "http://localhost",
    ).searchParams;

    expect(historyParams.get("sort")).toBe("createdAt_asc");
  });

  it("詳細または履歴が取得できない場合は notFound になる", async () => {
    notFoundMock.mockImplementation(() => {
      throw new Error("notFound");
    });

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: vi.fn(),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([]),
      });

    await expect(
      JobSeekerDetailPage({
        params: Promise.resolve({ jobSeekerId: "js-1" }),
      }),
    ).rejects.toThrow("notFound");

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
