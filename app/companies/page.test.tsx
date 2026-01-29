import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

import { cookies } from "next/headers";
import { getServerSession } from "next-auth";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import CompaniesPage from "./page";

const redirectMock = vi.fn((_url: string | URL) => {
  throw new Error("redirect");
});
vi.mock("next/navigation", () => ({
  redirect: (url: string | URL) => redirectMock(url),
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("CompaniesPage", () => {
  const cookiesMock = vi.mocked(cookies);
  const getServerSessionMock = vi.mocked(getServerSession);

  beforeEach(() => {
    redirectMock.mockReset();
    cookiesMock.mockResolvedValue({ getAll: () => [] } as any);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ companies: [] }),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it("未認証の場合は /login にリダイレクトする", async () => {
    getServerSessionMock.mockResolvedValueOnce(null as any);

    await expect(
      CompaniesPage({ searchParams: Promise.resolve({}) })
    ).rejects.toThrow("redirect");

    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("不正な検索パラメータの場合はエラーメッセージを表示する", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "sales-001" } });

    const ui = await CompaniesPage({
      searchParams: Promise.resolve({ q: "a".repeat(256) }),
    });

    render(ui);

    expect(
      screen.getByText("検索ワードが適切ではありません")
    ).toBeInTheDocument();
  });

  it("デフォルトで id 昇順が指定される", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "sales-001" } });

    await CompaniesPage({ searchParams: Promise.resolve({}) });

    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const url = fetchMock.mock.calls[0][0] as string;
    const params = new URL(url, "http://localhost").searchParams;

    expect(params.get("sortKey")).toBe("id");
    expect(params.get("sortOrder")).toBe("asc");
    expect(params.get("q")).toBeNull();
  });
});
