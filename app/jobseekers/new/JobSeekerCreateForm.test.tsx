import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

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
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

import JobSeekerCreateForm from "./JobSeekerCreateForm";

function fillForm() {
  fireEvent.change(screen.getByLabelText("氏名（必須）"), {
    target: { value: "Taro" },
  });
  fireEvent.change(screen.getByLabelText("年齢（任意）"), {
    target: { value: "28" },
  });
  fireEvent.change(screen.getByLabelText("メールアドレス（必須）"), {
    target: { value: "taro@example.com" },
  });
  fireEvent.change(screen.getByLabelText("電話番号（必須）"), {
    target: { value: "090-1234-5678" },
  });
  fireEvent.change(screen.getByLabelText("希望職種（必須）"), {
    target: { value: "Engineer" },
  });
  fireEvent.change(screen.getByLabelText("希望勤務地（必須）"), {
    target: { value: "Tokyo" },
  });
  fireEvent.change(screen.getByLabelText("メモ（任意）"), {
    target: { value: "note" },
  });
}

describe("JobSeekerCreateForm", () => {
  beforeEach(() => {
    mockIsPending = false;
    routerMock.replace.mockReset();
    routerMock.refresh.mockReset();
    routerMock.push.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("送信中は送信ボタンが無効化され、再送信しない", () => {
    mockIsPending = true;
    const { container } = render(<JobSeekerCreateForm created={false} />);

    const submitButton = screen.getByRole("button", { name: "作成中..." });
    expect(submitButton).toBeDisabled();

    const form = container.querySelector("form");
    if (!form) throw new Error("form element not found");
    fireEvent.submit(form);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("成功時はリダイレクトし、入力がクリアされる", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 201,
      json: vi.fn().mockResolvedValue({ ok: true, id: "js-1" }),
    });

    const { container } = render(<JobSeekerCreateForm created={false} />);
    fillForm();

    const form = container.querySelector("form");
    if (!form) throw new Error("form element not found");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith(
        "/jobseekers/new?created=1",
      );
      expect(routerMock.refresh).toHaveBeenCalled();
    });

    expect(screen.getByLabelText("氏名（必須）")).toHaveValue("");
    expect(screen.getByLabelText("年齢（任意）")).toHaveValue("");
    expect(screen.getByLabelText("メールアドレス（必須）")).toHaveValue("");
    expect(screen.getByLabelText("電話番号（必須）")).toHaveValue("");
    expect(screen.getByLabelText("希望職種（必須）")).toHaveValue("");
    expect(screen.getByLabelText("希望勤務地（必須）")).toHaveValue("");
    expect(screen.getByLabelText("メモ（任意）")).toHaveValue("");
  });
});
