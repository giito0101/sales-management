vi.mock("@/lib/prisma", () => ({
  prisma: {}, // JobSeekersPage が prisma を直接使わないならこれで十分
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

const getServerSessionMock = vi.mocked(getServerSession);

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import JobSeekersPage from "./page";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("JobSeekersPage", () => {
  const cookiesMock = vi.mocked(cookies);

  beforeEach(() => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "sales-001" },
    } as any);
    cookiesMock.mockResolvedValue({ getAll: () => [] } as any);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ jobSeekers: [] }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it("デフォルトで updatedAt の降順が指定される", async () => {
    await JobSeekersPage({ searchParams: Promise.resolve({}) });

    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const url = fetchMock.mock.calls[0][0] as string;
    const params = new URL(url, "http://localhost").searchParams;

    expect(params.get("sortKey")).toBe("updatedAt");
    expect(params.get("sortOrder")).toBe("desc");
    expect(params.get("q")).toBeNull();
  });
});
