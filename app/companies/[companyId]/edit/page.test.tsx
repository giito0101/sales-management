vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

import CompanyEditPage from "./page";
import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

const getServerSessionMock = vi.mocked(getServerSession);
const cookiesMock = vi.mocked(cookies);
const headersMock = vi.mocked(headers);
const redirectMock = vi.mocked(redirect);

describe("CompanyEditPage", () => {
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
      CompanyEditPage({
        params: Promise.resolve({ companyId: "c-1" }),
      }),
    ).rejects.toThrow("redirected");

    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("初期表示で企業情報がフォームに反映される", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        id: "c-1",
        name: "Acme",
        contact: "sales@example.com",
        industry: "IT",
        staff: "Taro",
      }),
    });

    const ui = await CompanyEditPage({
      params: Promise.resolve({ companyId: "c-1" }),
    });

    render(ui);

    expect(screen.getByDisplayValue("Acme")).toBeInTheDocument();
    expect(screen.getByDisplayValue("sales@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("IT")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Taro")).toBeInTheDocument();
  });
});
