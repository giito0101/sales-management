import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z, ZodError } from "zod";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { jobSeekerCreateSchema } from "@/features/jobseekers/jobSeekerCreateSchema";

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
      { status: 400 },
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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  // 認証必須
  const salesUserId = (session as any)?.user.id as string | undefined;
  const salesUserName = (session as any)?.user.name as string | undefined;

  if (!salesUserId || !salesUserName) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = await req.json();
    const parsed = jobSeekerCreateSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const jobSeeker = await tx.jobSeeker.create({
        data: {
          salesUserId,
          name: parsed.name,
          age: parsed.age,
          email: parsed.email,
          phone: parsed.phone,
          desiredJobType: parsed.desiredJobType,
          desiredLocation: parsed.desiredLocation,
          memo: parsed.memo,
          status: "NEW", // ✅ 新規
          // createdAt/updatedAt は schema の default / @updatedAt で自動
        },
        select: { id: true },
      });

      await tx.jobSeekerHistory.create({
        data: {
          jobSeekerId: jobSeeker.id,
          status: "NEW",
          memo: parsed.memo ?? null, // 履歴にもメモ複製（要件通り）
          salesUserId,
          salesUserName,
        },
        select: { id: true },
      });

      return jobSeeker;
    });

    return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        { ok: false, message: "Validation error", issues: e.issues },
        { status: 422 },
      );
    }
    console.error(e);
    return NextResponse.json(
      { ok: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
