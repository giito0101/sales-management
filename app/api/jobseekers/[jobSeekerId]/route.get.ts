// app/api/jobseekers/[jobSeekerId]/route.get.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const js = await prisma.jobSeeker.findFirst({
    where: { id: jobSeekerId, salesUserId },
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
