import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const salesUsers = await prisma.salesUser.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ salesUsers });
}
