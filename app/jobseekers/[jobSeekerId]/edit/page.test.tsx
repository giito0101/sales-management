import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

const prismaMock = vi.hoisted(() => ({
  jobSeeker: { findUnique: vi.fn() },
  salesUser: { findMany: vi.fn() },
}));

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

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import { getServerSession } from "next-auth";
// ✅ page.tsx が async function で JSX を返す想定
import Page from "./page";

describe("/jobseekers/[jobSeekerId]/edit page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("初期表示: GET結果がフォーム初期値として反映される", async () => {
    // ★ page.tsx が叩く GET のレスポンスに合わせて shape を調整
    const jobSeeker = {
      id: "js-1",
      name: "山田太郎",
      age: 30,
      email: "taro@example.com",
      phone: "090-0000-0000",
      desiredJobType: "フロントエンド",
      desiredLocation: "東京",
      salesUserId: "sales-001",
      status: "NEW",
      memo: "初期メモ",
      updatedAt: "2026-01-29T00:00:00.000Z",
    };

    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "sales-001" },
    });
    prismaMock.jobSeeker.findUnique.mockResolvedValue(jobSeeker);
    prismaMock.salesUser.findMany.mockResolvedValue([
      { id: "sales-001", name: "佐藤" },
      { id: "sales-002", name: "鈴木" },
    ]);

    const jsx = await Page({
      params: Promise.resolve({ jobSeekerId: "js-1" }),
    } as any);

    render(jsx);

    expect(screen.getByDisplayValue("山田太郎")).toBeInTheDocument();
    expect(screen.getByDisplayValue("taro@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("090-0000-0000")).toBeInTheDocument();
    expect(screen.getByDisplayValue("フロントエンド")).toBeInTheDocument();
    expect(screen.getByDisplayValue("東京")).toBeInTheDocument();
    expect(screen.getByDisplayValue("初期メモ")).toBeInTheDocument();

    // 数値は input type=number だと "30" になることが多い
    expect(screen.getByDisplayValue("30")).toBeInTheDocument();
  });
});
