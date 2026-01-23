// app/api/jobseekers/[id]/history/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const historyQuerySchema = z.object({
  sort: z.enum(["createdAt_desc", "createdAt_asc"]).default("createdAt_desc"),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const salesUserId = (session as any)?.user.id as string | undefined;
  if (!salesUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: jobSeekerId } = await params;

  // ✅ 求職者が自分の担当かチェック（履歴だけ直叩きされるのを防ぐ）
  const owner = await prisma.jobSeeker.findFirst({
    where: { id: jobSeekerId, salesUserId },
    select: { id: true },
  });
  if (!owner) {
    return NextResponse.json({ message: "Not Found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const parsed = historyQuerySchema.safeParse({
    sort: url.searchParams.get("sort") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid query", errors: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const orderBy =
    parsed.data.sort === "createdAt_asc"
      ? { createdAt: "asc" as const }
      : { createdAt: "desc" as const };

  const rows = await prisma.jobSeekerHistory.findMany({
    where: { jobSeekerId },
    orderBy,
    select: {
      id: true,
      status: true,
      memo: true,
      salesUserId: true,
      salesUserName: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  );
}
