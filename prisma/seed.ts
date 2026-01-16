import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

async function main() {
  const passwordHash = await hash("password123", 10);

  await prisma.salesUser.upsert({
    where: { id: "sales-001" },
    update: { name: "営業 太郎", password: passwordHash, isActive: true },
    create: {
      id: "sales-001",
      name: "営業 太郎",
      password: passwordHash,
      isActive: true,
    },
  });
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
