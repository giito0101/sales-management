// prisma/seed.ts
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

async function main() {
  const passwordHash = await hash("password123", 10);

  // --- 営業ユーザー作成 ---
  const salesUser = await prisma.salesUser.upsert({
    where: { id: "sales-001" },
    update: { name: "営業 太郎", password: passwordHash, isActive: true },
    create: {
      id: "sales-001",
      name: "営業 太郎",
      password: passwordHash,
      isActive: true,
    },
  });

  console.log("✅ SalesUser seeded:", salesUser.id);

  // --- 既存の求職者を削除（何度seedしても同じ状態になるように） ---
  await prisma.jobSeeker.deleteMany({
    where: { salesUserId: salesUser.id },
  });

  // --- ダミー求職者データ ---
  const now = Date.now();

  const jobSeekers = [
    {
      id: "js-001",
      name: "山田 一郎",
      email: "yamada@example.com",
      phone: "090-1111-1111",
      status: "NEW" as const,
      updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 1), // 1日前
    },
    {
      id: "js-002",
      name: "佐藤 花子",
      email: "sato@example.com",
      phone: "090-2222-2222",
      status: "INTERVIEWED" as const,
      updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 3),
    },
    {
      id: "js-003",
      name: "鈴木 次郎",
      email: "suzuki@example.com",
      phone: "090-3333-3333",
      status: "PROPOSING" as const,
      updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
    },
    {
      id: "js-004",
      name: "高橋 三郎",
      email: "takahashi@example.com",
      phone: "090-4444-4444",
      status: "OFFERED" as const,
      updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 5),
    },
    {
      id: "js-005",
      name: "田中 四郎",
      email: "tanaka@example.com",
      phone: "090-5555-5555",
      status: "CLOSED" as const,
      updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 10),
    },
  ];

  // --- 作成 ---
  await prisma.jobSeeker.createMany({
    data: jobSeekers.map((js) => ({
      salesUserId: salesUser.id,
      id: js.id,
      name: js.name,
      email: js.email,
      phone: js.phone,
      status: js.status,

      // ✅ 追加（必須）
      desiredJobType: "フロントエンド", // 例：あなたのenum/文字列に合わせる
      desiredLocation: "東京都", // 例：あなたの型に合わせる

      // updatedAt が手動で入れられる設計なら残す
      updatedAt: js.updatedAt,
    })),
  });

  console.log("✅ JobSeekers seeded:", jobSeekers.length);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
