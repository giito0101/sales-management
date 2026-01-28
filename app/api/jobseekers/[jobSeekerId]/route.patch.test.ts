// app/api/jobseekers/[jobSeekerId]/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

import { PATCH } from "./route";

// ---- Mock: prisma -------------------------------------------------
const { prismaMock, tx } = vi.hoisted(() => {
  const tx = {
    jobSeeker: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    salesUser: {
      findUnique: vi.fn(),
    },
    jobSeekerHistory: {
      create: vi.fn(),
    },
  };

  const prismaMock = {
    jobSeeker: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(async (cb: any) => cb(tx)),
  };

  return { prismaMock, tx };
});

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

// ---- Mock: auth/session ------------------------------------------
const getServerSessionMock = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: any[]) => getServerSessionMock(...args),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

// ---- helpers ------------------------------------------------------
function makeReq(body: any) {
  return {
    json: async () => body,
  } as any;
}

function basePayload() {
  return {
    name: "山田 太郎",
    age: 30,
    email: "taro@example.com",
    phone: "090-1234-5678",
    desiredJobType: "フロントエンドエンジニア",
    desiredLocation: "東京",
    memo: "メモ",
    status: "NEW",
  };
}

function setupDefaults() {
  getServerSessionMock.mockResolvedValue({
    user: { id: "sales-1" },
  });

  prismaMock.jobSeeker.findUnique.mockResolvedValue({
    id: "js-1",
    salesUserId: "sales-1",
    status: "NEW",
    name: "山田太郎",
    memo: "メモ",
  });

  tx.jobSeeker.update.mockResolvedValue({
    id: "js-1",
    salesUserId: "sales-1",
    status: "INTERVIEWED",
    memo: "メモ",
  });

  tx.salesUser.findUnique.mockResolvedValue({ name: "担当 太郎" });

  tx.jobSeekerHistory.create.mockResolvedValue({ id: "h-1" });
}

beforeEach(() => {
  vi.clearAllMocks();
  setupDefaults();
});

describe("PATCH /api/jobseekers/[jobSeekerId]", () => {
  it("更新: 編集可能フィールドは上書きされる", async () => {
    const req = makeReq({
      ...basePayload(),
      salesUserId: "sales-999",
      status: "INTERVIEWED",
      memo: "更新メモ",
    });

    await PATCH(req, { params: { jobSeekerId: "js-1" } } as any);

    const call = tx.jobSeeker.update.mock.calls[0]?.[0];
    expect(call.data.salesUserId).toBe("sales-999");
    expect(call.data.status).toBe("INTERVIEWED");
    expect(call.data.memo).toBe("更新メモ");
  });

  it("ステータス遷移: 不正遷移は更新されない", async () => {
    prismaMock.jobSeeker.findUnique.mockResolvedValueOnce({
      id: "js-1",
      salesUserId: "sales-1",
      status: "NEW",
      memo: "メモ",
    });

    const req = makeReq({
      ...basePayload(),
      status: "OFFERED", // ❌ NEW -> OFFERED は不正（例）
    });

    const res = await PATCH(req, { params: { jobSeekerId: "js-1" } } as any);

    expect(tx.jobSeeker.update).not.toHaveBeenCalled();
    expect(tx.jobSeekerHistory.create).not.toHaveBeenCalled();

    expect(res.status).toBe(400);
  });

  it("履歴: 変更がない場合は増えない", async () => {
    prismaMock.jobSeeker.findUnique.mockResolvedValueOnce({
      id: "js-1",
      salesUserId: "sales-1",
      status: "NEW",
      memo: "メモ",
    });
    tx.jobSeeker.update.mockResolvedValueOnce({
      id: "js-1",
      salesUserId: "sales-1",
      status: "NEW",
      memo: "メモ",
    });

    const req1 = makeReq({
      ...basePayload(),
      name: "名前だけ更新",
      status: "NEW", // 変わってない
    });

    await PATCH(req1, { params: { jobSeekerId: "js-1" } } as any);

    expect(tx.jobSeeker.update).toHaveBeenCalled();
    expect(tx.jobSeekerHistory.create).not.toHaveBeenCalled();
  });

  it("履歴: 変更がある場合は増える（例: ステータス変更）", async () => {
    vi.clearAllMocks();
    setupDefaults();

    const req2 = makeReq({
      ...basePayload(),
      status: "INTERVIEWED",
    });

    await PATCH(req2, { params: { jobSeekerId: "js-1" } } as any);

    expect(tx.jobSeeker.update).toHaveBeenCalled();
    expect(tx.jobSeekerHistory.create).toHaveBeenCalledTimes(1);
  });

  it("トランザクション: 履歴作成が失敗したら成功扱いにしない", async () => {
    tx.jobSeekerHistory.create.mockRejectedValueOnce(new Error("boom"));

    const req = makeReq({
      ...basePayload(),
      status: "INTERVIEWED", // 履歴が増える条件
    });

    const res = await PATCH(req, { params: { jobSeekerId: "js-1" } } as any);

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);

    expect(res.status).toBe(500);
  });

  it("バリデーション: 不正な入力は 422 を返す", async () => {
    const req = makeReq({
      ...basePayload(),
      email: "invalid-email",
    });

    const res = await PATCH(req, { params: { jobSeekerId: "js-1" } } as any);

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toMatchObject({
      message: "Validation error",
    });
  });
});
