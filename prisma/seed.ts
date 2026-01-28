// prisma/seed.ts
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

type SeedSalesUser = {
  id: string;
  name: string;
  passwordPlain: string;
  isActive: boolean;
};

type SeedJobSeeker = {
  id: string;
  salesUserId: string;
  name: string;
  email: string;
  phone: string;
  status: "NEW" | "INTERVIEWED" | "PROPOSING" | "OFFERED" | "CLOSED";
  updatedAt: Date;
  desiredJobType: string; // あなたの型に合わせて enum などに変えてOK
  desiredLocation: string; // 同上
};

function buildJobSeekers(
  salesUserId: string,
  suffix: string,
  now: number,
): SeedJobSeeker[] {
  const base: Omit<SeedJobSeeker, "salesUserId">[] = [
    {
      id: `js-${suffix}-001`,
      name: `山田 一郎(${suffix})`,
      email: `yamada_${suffix}@example.com`,
      phone: "090-1111-1111",
      status: "NEW",
      updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 1),
      desiredJobType: "フロントエンド",
      desiredLocation: "東京都",
    },
    {
      id: `js-${suffix}-002`,
      name: `佐藤 花子(${suffix})`,
      email: `sato_${suffix}@example.com`,
      phone: "090-2222-2222",
      status: "INTERVIEWED",
      updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 3),
      desiredJobType: "バックエンド",
      desiredLocation: "神奈川県",
    },
    {
      id: `js-${suffix}-003`,
      name: `鈴木 次郎(${suffix})`,
      email: `suzuki_${suffix}@example.com`,
      phone: "090-3333-3333",
      status: "PROPOSING",
      updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
      desiredJobType: "フルスタック",
      desiredLocation: "千葉県",
    },
  ];

  return base.map((js) => ({ ...js, salesUserId })); // ← salesUserId を必ず付与
}

async function main() {
  const now = Date.now();

  // --- salesUserを複数定義 ---
  const salesUsers: SeedSalesUser[] = [
    {
      id: "sales-001",
      name: "営業 太郎",
      passwordPlain: "password123",
      isActive: true,
    },
    {
      id: "sales-002",
      name: "営業 花子",
      passwordPlain: "password123",
      isActive: true,
    },
    {
      id: "sales-003",
      name: "営業 次郎",
      passwordPlain: "password123",
      isActive: false,
    },
    {
      id: "sales-004",
      name: "営業 四郎",
      passwordPlain: "password123",
      isActive: true,
    },
  ];

  const salesUserIds = salesUsers.map((u) => u.id);

  // --- 先に対象営業の配下データを削除（FK回避のため履歴→本体の順） ---
  await prisma.jobSeekerHistory.deleteMany({
    where: { jobSeeker: { salesUserId: { in: salesUserIds } } },
  });
  await prisma.jobSeeker.deleteMany({
    where: { salesUserId: { in: salesUserIds } },
  });

  // --- まず salesUser を upsert（passwordはユーザーごとにhash） ---
  const upsertedSalesUsers = await Promise.all(
    salesUsers.map(async (u) => {
      const passwordHash = await hash(u.passwordPlain, 10);
      const salesUser = await prisma.salesUser.upsert({
        where: { id: u.id },
        update: { name: u.name, password: passwordHash, isActive: u.isActive },
        create: {
          id: u.id,
          name: u.name,
          password: passwordHash,
          isActive: u.isActive,
        },
      });
      console.log("✅ SalesUser seeded:", salesUser.id);
      return salesUser;
    }),
  );

  // --- salesUserごとに jobSeeker を作る（毎回同じ状態に戻す） ---
  for (const su of upsertedSalesUsers) {
    // 既存削除（この営業の配下だけ）
    await prisma.jobSeekerHistory.deleteMany({
      where: { jobSeeker: { salesUserId: su.id } },
    });
    await prisma.jobSeeker.deleteMany({ where: { salesUserId: su.id } });

    // jobSeeker生成（suffixはsalesUserIdから作って衝突回避）
    const suffix = su.id.replace("sales-", "s"); // sales-001 -> s001
    const jobSeekers = buildJobSeekers(su.id, suffix, now);

    await prisma.jobSeeker.createMany({
      data: jobSeekers.map((js) => ({
        id: js.id,
        salesUserId: js.salesUserId,
        name: js.name,
        email: js.email,
        phone: js.phone,
        status: js.status,
        desiredJobType: js.desiredJobType,
        desiredLocation: js.desiredLocation,
        updatedAt: js.updatedAt, // updatedAtを手動で入れたい場合のみ
      })),
    });

    console.log(`✅ JobSeekers seeded for ${su.id}:`, jobSeekers.length);
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
