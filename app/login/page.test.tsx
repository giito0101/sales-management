// app/login/page.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ★ page.tsx が default export している想定
import LoginPage from "./page";

// next/navigation をモック（push されるか確認）
const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
  useSearchParams: () => new URLSearchParams(""),
}));

// next-auth/react の signIn をモック（credentials 認証の呼び出し確認）
const signInMock = vi.fn();
vi.mock("next-auth/react", async () => {
  return {
    signIn: (...args: unknown[]) => signInMock(...args),
  };
});

describe("LoginPage (/login)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("無効入力 → バリデーションエラーが表示される", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    // 何も入れずに送信
    await user.click(screen.getByRole("button", { name: /ログイン|login/i }));

    // ここは実装しているメッセージに合わせて調整
    // 例：必須です / 入力してください / 8文字以上 など
    expect(
      await screen.findByText(/必須|入力してください/i),
    ).toBeInTheDocument();
  });

  it("有効入力 → credentials signIn が呼ばれ、成功時は /jobseekers に遷移する", async () => {
    const user = userEvent.setup();

    // 認証成功
    signInMock.mockResolvedValueOnce({ ok: true, error: null });

    render(<LoginPage />);

    // ラベル/placeholder はあなたのUIに合わせて調整
    await user.type(screen.getByLabelText(/ID/i), "sales-001");
    await user.type(
      screen.getByLabelText(/パスワード|password/i),
      "password123",
    );

    await user.click(screen.getByRole("button", { name: /ログイン|login/i }));

    // signIn(credentials) が呼ばれること
    expect(signInMock).toHaveBeenCalledTimes(1);

    const [provider, options] = signInMock.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];

    expect(provider).toBe("credentials");
    expect(options).toMatchObject({
      redirect: false,
      id: "sales-001",
      password: "password123",
    });

    // 成功時は求職者一覧へ（実装が router.push の場合）
    expect(pushMock).toHaveBeenCalledWith("/jobseekers");
  });

  it("認証失敗 → 『IDまたはパスワードが違います』が表示され、遷移しない", async () => {
    const user = userEvent.setup();

    // 失敗パターン（NextAuth だと error が返る想定が多い）
    signInMock.mockResolvedValueOnce({ ok: false, error: "CredentialsSignin" });

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/ID/i), "sales-001");
    await user.type(
      screen.getByLabelText(/パスワード|password/i),
      "wrongpass999",
    );

    await user.click(screen.getByRole("button", { name: /ログイン|login/i }));

    expect(
      await screen.findByText("IDまたはパスワードが違います"),
    ).toBeInTheDocument();

    expect(pushMock).not.toHaveBeenCalled();
  });
});
