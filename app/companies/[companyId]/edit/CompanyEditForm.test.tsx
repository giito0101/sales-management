import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

let mockIsPending = false;

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useTransition: () => [mockIsPending, (cb: () => void) => cb()],
  };
});

const routerMock = {
  replace: vi.fn(),
  refresh: vi.fn(),
  push: vi.fn(),
  back: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

import CompanyEditForm from "./CompanyEditForm";

describe("CompanyEditForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockIsPending = false;
    routerMock.replace.mockReset();
    routerMock.refresh.mockReset();
    routerMock.push.mockReset();
    routerMock.back.mockReset();
  });

  it("PATCH成功時、詳細画面へ遷移し updated=1 が付与される", async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "企業情報を更新しました" }),
    });

    global.fetch = fetchMock as any;

    render(
      <CompanyEditForm
        companyId="c-1"
        initial={{
          name: "Acme",
          contact: "sales@example.com",
          industry: "IT",
          staff: "Taro",
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(routerMock.push).toHaveBeenCalledWith("/companies/c-1?updated=1");
    expect(routerMock.refresh).toHaveBeenCalledTimes(1);
  });

  it("バリデーションエラー時、各項目の下にエラーメッセージが表示される", async () => {
    const user = userEvent.setup();

    render(
      <CompanyEditForm
        companyId="c-1"
        initial={{
          name: "Acme",
          contact: "sales@example.com",
          industry: "IT",
          staff: "Taro",
        }}
      />,
    );

    const nameInput = screen.getByLabelText("企業名（必須）");
    await user.clear(nameInput);

    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(screen.getByText("企業名は必須です")).toBeInTheDocument();
  });

  it("PATCH失敗時、画面上部にサーバーエラーが表示される", async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: "更新に失敗しました" }),
    });

    global.fetch = fetchMock as any;

    render(
      <CompanyEditForm
        companyId="c-1"
        initial={{
          name: "Acme",
          contact: "sales@example.com",
          industry: "IT",
          staff: "Taro",
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(
      await screen.findByText("更新に失敗しました"),
    ).toBeInTheDocument();
  });
});
