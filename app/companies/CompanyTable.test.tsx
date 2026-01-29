import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import CompanyTable from "./CompanyTable";
import type { CompanyRow } from "./companyTableUtils";

let pushMock = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => mockSearchParams,
}));

describe("CompanyTable", () => {
  const companies: CompanyRow[] = [
    {
      id: "c-1",
      name: "Acme",
      contact: "03-0000-0000",
      industry: "IT",
      staff: "Taro",
    },
  ];

  beforeEach(() => {
    pushMock = vi.fn();
    mockSearchParams = new URLSearchParams();
  });

  it("空のときは空状態メッセージを表示する", () => {
    render(
      <CompanyTable
        initialQuery=""
        initialSortKey="id"
        initialSortOrder="asc"
        companies={[]}
        errorMessage={null}
      />
    );

    expect(screen.getByText("表示する企業がありません")).toBeInTheDocument();
  });

  it("企業一覧が表示される", () => {
    render(
      <CompanyTable
        initialQuery=""
        initialSortKey="id"
        initialSortOrder="asc"
        companies={companies}
        errorMessage={null}
      />
    );

    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("03-0000-0000")).toBeInTheDocument();
    expect(screen.getByText("IT")).toBeInTheDocument();
    expect(screen.getByText("Taro")).toBeInTheDocument();

    const idLink = screen.getByRole("link", { name: "c-1" });
    expect(idLink).toHaveAttribute("href", "/companies/c-1");
  });

  it("検索の正常系でクエリが作られる", () => {
    render(
      <CompanyTable
        initialQuery=""
        initialSortKey="id"
        initialSortOrder="asc"
        companies={companies}
        errorMessage={null}
      />
    );

    const input = screen.getByPlaceholderText(
      "企業名 / 連絡先 / 業種 / 担当者で検索"
    );
    fireEvent.change(input, { target: { value: "Acme" } });
    fireEvent.click(screen.getByRole("button", { name: "検索" }));

    expect(pushMock).toHaveBeenCalledTimes(1);
    const url = pushMock.mock.calls[0][0] as string;

    const params = new URL(url, "http://localhost").searchParams;
    expect(params.get("q")).toBe("Acme");
    expect(params.get("sortKey")).toBe("id");
    expect(params.get("sortOrder")).toBe("asc");
  });

  it("検索の異常系でエラーメッセージが出る", () => {
    render(
      <CompanyTable
        initialQuery=""
        initialSortKey="id"
        initialSortOrder="asc"
        companies={companies}
        errorMessage={null}
      />
    );

    const input = screen.getByPlaceholderText(
      "企業名 / 連絡先 / 業種 / 担当者で検索"
    );
    fireEvent.change(input, { target: { value: "a".repeat(256) } });
    fireEvent.click(screen.getByRole("button", { name: "検索" }));

    expect(
      screen.getByText("検索ワードが適切ではありません")
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("同じカラムをクリックすると並び順がトグルされる", () => {
    render(
      <CompanyTable
        initialQuery=""
        initialSortKey="id"
        initialSortOrder="asc"
        companies={companies}
        errorMessage={null}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /ID/ }));

    expect(pushMock).toHaveBeenCalledTimes(1);
    const url = pushMock.mock.calls[0][0] as string;
    const params = new URL(url, "http://localhost").searchParams;

    expect(params.get("sortKey")).toBe("id");
    expect(params.get("sortOrder")).toBe("desc");
  });
});
