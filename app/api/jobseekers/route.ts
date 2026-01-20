import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const querySchema = z.object({
  q: z.string().max(255).optional().default(""),
  sortKey: z.enum(["updatedAt", "id", "name"]).optional().default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const raw = {
    q: url.searchParams.get("q") ?? "",
    sortKey: url.searchParams.get("sortKey") ?? undefined,
    sortOrder: url.searchParams.get("sortOrder") ?? undefined,
  };

  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "検索ワードが適切ではありません" },
      { status: 400 }
    );
  }

  const { q, sortKey, sortOrder } = parsed.data;

  const where = {
    salesUserId: session.user.id,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
            {
              salesUser: {
                name: { contains: q, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };

  const orderBy =
    sortKey === "id"
      ? { id: sortOrder }
      : sortKey === "name"
      ? { name: sortOrder }
      : { updatedAt: sortOrder };

  const jobSeekers = await prisma.jobSeeker.findMany({
    where,
    orderBy,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      updatedAt: true,
      salesUser: { select: { name: true } },
    },
    take: 200, // 最小構成：ひとまず上限。必要ならページング追加
  });

  return NextResponse.json({ jobSeekers });
}
