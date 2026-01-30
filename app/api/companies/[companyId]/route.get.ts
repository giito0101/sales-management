// app/api/companies/[companyId]/route.get.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { companyId } = await params;

  const company = await prisma.company.findFirst({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      contact: true,
      industry: true,
      staff: true,
    },
  });

  if (!company) {
    return NextResponse.json({ message: "Not Found" }, { status: 404 });
  }

  return NextResponse.json(company);
}
