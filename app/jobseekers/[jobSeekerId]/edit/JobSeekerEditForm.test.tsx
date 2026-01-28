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

import JobSeekerEditForm from "./JobSeekerEditForm";

type FetchCall = {
  input: RequestInfo | URL;
  init?: RequestInit;
};

function getFetchCalls(mock: any): FetchCall[] {
  return mock.mock.calls.map(([input, init]: any[]) => ({ input, init }));
}

describe("JobSeekerEditForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockIsPending = false;
    routerMock.replace.mockReset();
    routerMock.refresh.mockReset();
    routerMock.push.mockReset();
    routerMock.back.mockReset();
  });

  it("初期値が反映され、memo変更→保存で PATCH /api/jobseekers/{id} が呼ばれる", async () => {
    const user = userEvent.setup();

    // ★ JobSeekerEditForm の props に合わせて調整
    const initial = {
      name: "山田太郎",
      age: 30,
      email: "taro@example.com",
      phone: "090-0000-0000",
      desiredJobType: "フロントエンド",
      desiredLocation: "東京",
      salesUserId: "sales-001",
      status: "NEW" as const,
      memo: "初期メモ",
    };

    const salesUsers = [
      { id: "sales-001", name: "佐藤" },
      { id: "sales-002", name: "鈴木" },
    ];

    const fetchMock = vi
      .fn()
      // ✅ PATCH 成功レスポンス
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ jobSeeker: { ...initial, memo: "変更後メモ" } }),
      });

    global.fetch = fetchMock as any;

    render(
      <JobSeekerEditForm
        jobSeekerId="js-1"
        initial={initial}
        salesUsers={salesUsers}
      />,
    );

    // ✅ 初期値（フォーム反映）確認
    expect(screen.getByDisplayValue("山田太郎")).toBeInTheDocument();
    expect(screen.getByDisplayValue("初期メモ")).toBeInTheDocument();

    // ✅ memo を変更
    // label が「メモ」ならこれが最強。違う場合は role/name を調整
    const memo = screen.getByDisplayValue("初期メモ");
    await user.clear(memo);
    await user.type(memo, "変更後メモ");

    // ✅ 保存（ボタン文言は実装に合わせて調整）
    await user.click(screen.getByRole("button", { name: /保存|更新|save/i }));

    // ✅ PATCH が呼ばれたか
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const call = getFetchCalls(fetchMock)[0];
    expect(String(call.input)).toContain("/api/jobseekers/js-1");

    // method / headers / body 検証
    expect(call.init?.method).toBe("PATCH");

    // body の中身確認（フォーム全項目送ってる or 差分だけ送ってる等、実装に合わせて調整）
    const body = call.init?.body ? JSON.parse(String(call.init.body)) : null;

    // ✅ 最低限「memo が変更された値で送られている」を見る
    expect(body?.memo).toBe("変更後メモ");

    // ✅ allowlist方式で編集可能フィールドのみ送る場合の検証
    expect(body?.status).toBe("NEW");
    expect(body?.salesUserId).toBe("sales-001");
  });
});
