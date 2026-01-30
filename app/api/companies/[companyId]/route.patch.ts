// app/api/companies/[companyId]/route.patch.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { companyEditSchema } from "@/features/companies/companyEditSchema";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { companyId } = await params;

  const json = await req.json().catch(() => null);
  const parsed = companyEditSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation error", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const existing = await prisma.company.findFirst({
    where: { id: companyId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "Not Found" }, { status: 404 });
  }

  try {
    await prisma.company.update({
      where: { id: companyId },
      data: {
        name: parsed.data.name,
        contact: parsed.data.contact ?? null,
        industry: parsed.data.industry,
        staff: parsed.data.staff,
      },
    });

    return NextResponse.json({ message: "企業情報を更新しました" });
  } catch (err) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
