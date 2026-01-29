import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const querySchema = z.object({
  q: z.string().max(255).optional().default(""),
  sortKey: z.enum(["id", "name"]).optional().default("id"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
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
      { status: 400 },
    );
  }

  const { q, sortKey, sortOrder } = parsed.data;

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { contact: { contains: q, mode: "insensitive" as const } },
          { industry: { contains: q, mode: "insensitive" as const } },
          { staff: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const orderBy = sortKey === "name" ? { name: sortOrder } : { id: sortOrder };

  const companies = await prisma.company.findMany({
    where,
    orderBy,
    select: {
      id: true,
      name: true,
      contact: true,
      industry: true,
      staff: true,
    },
    take: 200,
  });

  return NextResponse.json({ companies });
}
