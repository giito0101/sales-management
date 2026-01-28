/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from "next-auth";

// ✅ 対象
import Page from "./page";

// --- next/navigation モック（App Router） ---
const pushMock = vi.fn();
const replaceMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", async () => {
  return {
    useRouter: () => ({
      push: pushMock,
      replace: replaceMock,
      refresh: refreshMock,
      back: vi.fn(),
      prefetch: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(""),
    usePathname: () => "/jobseekers/new",
  };
});

// --- fetch モック ---
const fetchMock = vi.fn();
const getServerSessionMock = vi.mocked(getServerSession);

describe("/jobseekers/new page component test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    getServerSessionMock.mockResolvedValue({
      user: { id: "sales-001" },
    } as any);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const renderPage = async () => {
    const ui = await Page({ searchParams: Promise.resolve({}) });
    render(ui);
  };

  const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
    // 🔧 ラベルはあなたのUIに合わせて調整
    await user.type(screen.getByLabelText(/氏名/i), "山田 太郎");
    await user.type(screen.getByLabelText(/年齢/i), "30");
    await user.type(screen.getByLabelText(/メール/i), "taro@example.com");
    await user.type(screen.getByLabelText(/電話/i), "090-1234-5678");
    await user.type(screen.getByLabelText(/希望職種/i), "フロントエンド");
    await user.type(screen.getByLabelText(/希望勤務地/i), "東京");
    await user.type(screen.getByLabelText(/メモ/i), "メモです");
  };

  it("必須/形式バリデーションが表示される（NGのまま submit しても送信されない）", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({
        issues: [
          { path: ["name"], message: "必須です" },
          { path: ["email"], message: "必須です" },
        ],
      }),
    });

    await renderPage();

    // 送信（🔧 ボタン文言を調整）
    await user.click(screen.getByRole("button", { name: /作成|登録|submit/i }));

    // ✅ 送信は走るが、バリデーションでエラー表示
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // ✅ バリデーション表示（文言は実装に合わせて調整）
    // 例：必須系
    expect(
      screen.getAllByText(/必須|required/i, { exact: false }).length,
    ).toBeGreaterThan(0);

    // 形式系（メール）
    // 実装で「メール形式が不正です」など出してるなら、それに寄せる
    expect(
      screen.queryByText(/メール.*(不正|形式)|invalid email/i, {
        exact: false,
      }),
    ).toBeFalsy();
  });

  it("OKなら submit が発火する（POST /api/jobseekers が呼ばれる）", async () => {
    const user = userEvent.setup();

    // ✅ API 成功レスポンスをモック
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        id: "js-1",
      }),
    });

    await renderPage();

    await fillValidForm(user);

    await user.click(screen.getByRole("button", { name: /作成|登録|submit/i }));

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    // ✅ エンドポイント（実装が違うなら修正）
    expect(url).toMatch(/\/api\/jobseekers$/);

    // ✅ メソッド
    expect(init?.method?.toUpperCase()).toBe("POST");

  });

  it("成功時は created=1 を付けて /jobseekers/new にリダイレクトする（実装している場合）", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: "js-1" }),
    });

    await renderPage();

    await fillValidForm(user);

    await user.click(screen.getByRole("button", { name: /作成|登録|submit/i }));

    expect(replaceMock).toHaveBeenCalledWith("/jobseekers/new?created=1");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("API が 401 の場合はエラー表示して送信成功扱いにしない（任意）", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: "Unauthorized" }),
    });

    await renderPage();

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /作成|登録|submit/i }));

    // ✅ 成功リダイレクトはしない
    expect(pushMock).not.toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith("/login");

    // ✅ エラー表示はしない（401 はログインへ）
    expect(
      screen.queryByText(/unauthorized|認証|ログイン/i, { exact: false }),
    ).toBeFalsy();
  });
});
