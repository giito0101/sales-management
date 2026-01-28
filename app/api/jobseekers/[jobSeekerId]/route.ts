// app/api/jobseekers/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jobSeekerEditSchema } from "@/features/jobseekers/jobSeekerEditSchema";
const ORDER = ["NEW", "INTERVIEWED", "PROPOSING", "OFFERED", "CLOSED"] as const;
type Status = (typeof ORDER)[number];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobSeekerId: string }> },
) {
  const session = await getServerSession(authOptions);
  const salesUserId = (session as any)?.user.id as string | undefined;
  if (!salesUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { jobSeekerId } = await params;

  const id = jobSeekerId;

  const js = await prisma.jobSeeker.findFirst({
    where: { id, salesUserId }, // ✅ 自分の担当求職者のみ
    select: {
      id: true,
      name: true,
      age: true,
      email: true,
      phone: true,
      desiredJobType: true,
      desiredLocation: true,
      status: true,
      updatedAt: true,
      memo: true,
      salesUser: { select: { name: true } },
    },
  });

  if (!js) {
    return NextResponse.json({ message: "Not Found" }, { status: 404 });
  }

  return NextResponse.json({
    id: js.id,
    name: js.name,
    age: js.age,
    email: js.email,
    phone: js.phone,
    desiredJobType: js.desiredJobType,
    desiredLocation: js.desiredLocation,
    status: js.status,
    updatedAt: js.updatedAt.toISOString(),
    memo: js.memo,
    salesUserName: js.salesUser.name,
  });
}

function isAllowedTransition(from: Status, to: Status) {
  if (from === to) return true;
  if (to === "CLOSED") return true; // 例外：各状態→CLOSED OK :contentReference[oaicite:9]{index=9}
  const fromIdx = ORDER.indexOf(from);
  const toIdx = ORDER.indexOf(to);
  return toIdx === fromIdx + 1; // 基本：順方向のみ :contentReference[oaicite:10]{index=10}
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ jobSeekerId: string }> },
) {
  const session = await getServerSession(authOptions);
  const loginSalesUserId = (session as any)?.user?.id as string | undefined;
  if (!loginSalesUserId)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { jobSeekerId } = await ctx.params;

  const json = await req.json().catch(() => null);
  const parsed = jobSeekerEditSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Bad Request" },
      { status: 400 },
    );
  }

  const current = await prisma.jobSeeker.findUnique({
    where: { id: jobSeekerId },
  });
  if (!current)
    return NextResponse.json({ message: "Not Found" }, { status: 404 });

  const nextStatus = (parsed.data.status ?? current.status) as Status;
  if (!isAllowedTransition(current.status as Status, nextStatus)) {
    return NextResponse.json(
      { message: "不正なステータス遷移です" },
      { status: 400 },
    ); // 不正遷移は400 :contentReference[oaicite:11]{index=11}
  }

  const nextSalesUserId = parsed.data.salesUserId ?? current.salesUserId;
  const nextMemo = parsed.data.memo ?? null;

  const statusChanged = nextStatus !== current.status;
  const salesUserChanged = nextSalesUserId !== current.salesUserId;
  const memoChanged = (nextMemo ?? null) !== (current.memo ?? null);

  // 同一Tx：JobSeeker更新 + (必要なら)History追加 :contentReference[oaicite:12]{index=12}
  const result = await prisma.$transaction(async (tx) => {
    const jobSeeker = await tx.jobSeeker.update({
      where: { id: jobSeekerId },
      data: {
        name: parsed.data.name,
        age: parsed.data.age ?? null,
        email: parsed.data.email,
        phone: parsed.data.phone,
        desiredJobType: parsed.data.desiredJobType,
        desiredLocation: parsed.data.desiredLocation,
        salesUserId: nextSalesUserId,
        status: nextStatus,
        memo: nextMemo,
      },
    });

    if (statusChanged || salesUserChanged || memoChanged) {
      const su = await tx.salesUser.findUnique({
        where: { id: nextSalesUserId },
        select: { name: true },
      });

      await tx.jobSeekerHistory.create({
        data: {
          jobSeekerId: jobSeeker.id,
          status: jobSeeker.status as any,
          memo: jobSeeker.memo ?? null,
          salesUserId: jobSeeker.salesUserId,
          salesUserName: su?.name ?? "",
        },
      });
      // 変更時のみ1件追加 :contentReference[oaicite:13]{index=13}
    }

    return jobSeeker;
  });

  return NextResponse.json({ jobSeeker: result });
}
