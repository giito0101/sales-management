// app/jobseekers/[jobSeekerId]/edit/page.tsx
import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import JobSeekerEditForm from "./JobSeekerEditForm";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ jobSeekerId: string }> };

export default async function JobSeekerEditPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const salesUserId = (session as any)?.user?.id as string | undefined;
  if (!salesUserId) redirect("/login"); // 未ログインは/loginへ

  const { jobSeekerId } = await params;

  const jobSeeker = await prisma.jobSeeker.findUnique({
    where: { id: jobSeekerId },
    include: { salesUser: { select: { id: true, name: true } } },
  });

  if (!jobSeeker) notFound();

  const salesUsers = await prisma.salesUser.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto w-full max-w-2xl p-6 space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-bold">求職者 編集</h1>
        <p className="text-sm text-muted-foreground">
          ステータス遷移はルールに従います（巻き戻し不可）。
        </p>
      </div>

      <JobSeekerEditForm
        jobSeekerId={jobSeeker.id}
        initial={{
          name: jobSeeker.name,
          age: jobSeeker.age ?? null,
          email: jobSeeker.email,
          phone: jobSeeker.phone,
          desiredJobType: jobSeeker.desiredJobType,
          desiredLocation: jobSeeker.desiredLocation,
          salesUserId: jobSeeker.salesUserId,
          status: jobSeeker.status as any,
          memo: jobSeeker.memo ?? null,
        }}
        salesUsers={salesUsers}
      />
    </div>
  );
}
