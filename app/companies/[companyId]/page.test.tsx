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
import { render, screen } from "@testing-library/react";

import CompanyDetailPage from "./page";
import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";

const getServerSessionMock = vi.mocked(getServerSession);
const cookiesMock = vi.mocked(cookies);
const headersMock = vi.mocked(headers);
const redirectMock = vi.mocked(redirect);
const notFoundMock = vi.mocked(notFound);

describe("CompanyDetailPage", () => {
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
      CompanyDetailPage({
        params: Promise.resolve({ companyId: "c-1" }),
      }),
    ).rejects.toThrow("redirected");

    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("企業が存在しない場合は notFound になる", async () => {
    notFoundMock.mockImplementation(() => {
      throw new Error("notFound");
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: vi.fn(),
    });

    await expect(
      CompanyDetailPage({
        params: Promise.resolve({ companyId: "c-1" }),
      }),
    ).rejects.toThrow("notFound");

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("企業詳細を表示し、戻る/編集リンクが正しい", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        id: "c-1",
        name: "Acme",
        contact: "03-0000-0000",
        industry: "IT",
        staff: "Taro",
      }),
    });

    const ui = await CompanyDetailPage({
      params: Promise.resolve({ companyId: "c-1" }),
      searchParams: Promise.resolve({}),
    });

    render(ui);

    expect(screen.getByText("c-1")).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("03-0000-0000")).toBeInTheDocument();
    expect(screen.getByText("IT")).toBeInTheDocument();
    expect(screen.getByText("Taro")).toBeInTheDocument();

    const backLink = screen.getByRole("link", { name: "戻る" });
    const editLink = screen.getByRole("link", { name: "編集" });

    expect(backLink).toHaveAttribute("href", "/companies");
    expect(editLink).toHaveAttribute("href", "/companies/c-1/edit");
  });
});
