import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import JobSeekerCreateForm from "./JobSeekerCreateForm";

type PageProps = {
  searchParams: Promise<{ created?: string }>;
};

export default async function JobSeekersNewPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const salesUserId = (session as any)?.salesUserId as string | undefined;

  //   if (!salesUserId) redirect("/login");

  const sp = await searchParams;
  const created = sp.created === "1";

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <h1 className="text-xl font-bold">求職者 新規作成</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        営業担当者として求職者を新規作成します。
      </p>

      <JobSeekerCreateForm created={created} />
    </div>
  );
}
