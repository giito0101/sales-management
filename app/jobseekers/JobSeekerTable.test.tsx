import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import JobSeekerTable from "./JobSeekerTable";
import type { JobSeekerRow } from "./jobSeekerTableUtils";

let pushMock = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => mockSearchParams,
}));

describe("JobSeekerTable", () => {
  const jobSeekers: JobSeekerRow[] = [
    {
      id: "js_1",
      name: "山田太郎",
      email: "taro@example.com",
      phone: "090-0000-0000",
      status: "NEW",
      updatedAt: "2024-01-02T03:04:05.000Z",
      salesUser: { name: "営業一郎" },
    },
  ];

  beforeEach(() => {
    pushMock = vi.fn();
    mockSearchParams = new URLSearchParams();
  });

  it("初期表示でテーブルと項目が表示される", () => {
    render(
      <JobSeekerTable
        initialQuery=""
        initialSortKey="updatedAt"
        initialSortOrder="desc"
        jobSeekers={jobSeekers}
        errorMessage={null}
      />
    );

    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("氏名")).toBeInTheDocument();
    expect(screen.getByText("メールアドレス")).toBeInTheDocument();
    expect(screen.getByText("電話番号")).toBeInTheDocument();
    expect(screen.getByText("担当者名")).toBeInTheDocument();
    expect(screen.getByText("ステータス")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /最終更新日/ })
    ).toBeInTheDocument();

    expect(screen.getByText("山田太郎")).toBeInTheDocument();
    expect(screen.getByText("taro@example.com")).toBeInTheDocument();
    expect(screen.getByText("090-0000-0000")).toBeInTheDocument();
    expect(screen.getByText("営業一郎")).toBeInTheDocument();
    expect(screen.getByText("新規")).toBeInTheDocument();

    const idLink = screen.getByRole("link", { name: "js_1" });
    expect(idLink).toHaveAttribute("href", "/jobseekers/js_1");
  });

  it("デフォルトで最終更新日が降順になっている", () => {
    render(
      <JobSeekerTable
        initialQuery=""
        initialSortKey="updatedAt"
        initialSortOrder="desc"
        jobSeekers={jobSeekers}
        errorMessage={null}
      />
    );

    expect(
      screen.getByRole("button", { name: "最終更新日 ▼" })
    ).toBeInTheDocument();
  });

  it("検索の正常系でクエリが作られて一覧へ戻る", () => {
    render(
      <JobSeekerTable
        initialQuery=""
        initialSortKey="updatedAt"
        initialSortOrder="desc"
        jobSeekers={jobSeekers}
        errorMessage={null}
      />
    );

    const input = screen.getByPlaceholderText(
      "氏名 / メール / 電話 / 担当者で検索"
    );
    fireEvent.change(input, { target: { value: "営業 太郎" } });
    fireEvent.click(screen.getByRole("button", { name: "検索" }));

    expect(pushMock).toHaveBeenCalledTimes(1);
    const url = pushMock.mock.calls[0][0] as string;
    expect(url.startsWith("/jobseekers?")).toBe(true);

    const params = new URL(url, "http://localhost").searchParams;
    expect(params.get("q")).toBe("営業 太郎");
    expect(params.get("sortKey")).toBe("updatedAt");
    expect(params.get("sortOrder")).toBe("desc");
  });

  it("検索の異常系でエラーメッセージが出る", () => {
    render(
      <JobSeekerTable
        initialQuery=""
        initialSortKey="updatedAt"
        initialSortOrder="desc"
        jobSeekers={jobSeekers}
        errorMessage={null}
      />
    );

    const input = screen.getByPlaceholderText(
      "氏名 / メール / 電話 / 担当者で検索"
    );
    fireEvent.change(input, { target: { value: "a".repeat(256) } });
    fireEvent.click(screen.getByRole("button", { name: "検索" }));

    expect(
      screen.getByText("検索ワードが適切ではありません")
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
