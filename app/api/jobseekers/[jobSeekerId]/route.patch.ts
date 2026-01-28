// app/api/jobseekers/[jobSeekerId]/route.patch.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jobSeekerEditSchema } from "@/features/jobseekers/jobSeekerEditSchema";
import { isAllowedTransition, type Status } from "./_shared";

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
      { message: "Validation error", issues: parsed.error.issues },
      { status: 422 },
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
    );
  }

  const nextSalesUserId = parsed.data.salesUserId ?? current.salesUserId;
  const nextMemo = parsed.data.memo ?? null;

  const statusChanged = nextStatus !== current.status;
  const salesUserChanged = nextSalesUserId !== current.salesUserId;
  const memoChanged = (nextMemo ?? null) !== (current.memo ?? null);

  try {
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
      }

      return jobSeeker;
    });

    return NextResponse.json({ jobSeeker: result });
  } catch (err) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
