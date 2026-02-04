// app/jobseekers/page.tsx
import { cookies } from "next/headers";
import Link from "next/link";
import JobSeekerTable from "./JobSeekerTable";
import { Button } from "@/components/ui/button"; // shadcn Button
import { jobSeekerSearchParamsSchema } from "@/features/jobseekers/searchSchema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ListSidebar } from "@/components/ListSidebar";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function PageHeader() {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold">求職者一覧</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          求職者を検索・並び替えできます。
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button asChild>
          <Link href="/jobseekers/new">新規作成</Link>
        </Button>
      </div>
    </div>
  );
}

async function cookiesToHeader() {
  const store = await cookies();
  return store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

async function fetchJobSeekers(params: {
  q?: string;
  sortKey?: string;
  sortOrder?: string;
}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.sortKey) qs.set("sortKey", params.sortKey);
  if (params.sortOrder) qs.set("sortOrder", params.sortOrder);

  const cookieHeader = await cookiesToHeader();

  const res = await fetch(
    `${process.env.NEXTAUTH_URL ?? ""}/api/jobseekers?${qs.toString()}`,
    {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    },
  );

  return res;
}

export default async function JobSeekersPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const salesUserId = (session as any)?.user.id as string | undefined;

  if (!salesUserId) redirect("/login");
  const sp = (searchParams ? await searchParams : {}) as Record<
    string,
    string | string[] | undefined
  >;

  const raw = {
    q: typeof sp.q === "string" ? sp.q : undefined,
    sortKey: typeof sp.sortKey === "string" ? sp.sortKey : undefined,
    sortOrder: typeof sp.sortOrder === "string" ? sp.sortOrder : undefined,
  };

  const parsed = jobSeekerSearchParamsSchema.safeParse(raw);

  if (!parsed.success) {
    return (
      <div className="flex h-screen overflow-hidden">
        <ListSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto w-full max-w-6xl space-y-4">
            <PageHeader />
            <JobSeekerTable
              initialQuery={raw.q ?? ""}
              initialSortKey="updatedAt"
              initialSortOrder="desc"
              jobSeekers={[]}
              errorMessage="検索ワードが適切ではありません"
            />
          </div>
        </main>
      </div>
    );
  }

  const q = parsed.data.q ?? "";
  const sortKey = parsed.data.sortKey ?? "updatedAt";
  const sortOrder = parsed.data.sortOrder ?? "desc";

  const res = await fetchJobSeekers({ q, sortKey, sortOrder });

  if (!res.ok) {
    return (
      <div className="flex h-screen overflow-hidden">
        <ListSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto w-full max-w-6xl space-y-4">
            <PageHeader />
            <JobSeekerTable
              initialQuery={q}
              initialSortKey={sortKey}
              initialSortOrder={sortOrder}
              jobSeekers={[]}
              errorMessage="検索ワードが適切ではありません"
            />
          </div>
        </main>
      </div>
    );
  }

  const data = (await res.json()) as { jobSeekers: any[] };

  return (
    <div className="flex h-screen overflow-hidden">
      <ListSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto w-full max-w-6xl space-y-4">
          <PageHeader />
          <JobSeekerTable
            initialQuery={q}
            initialSortKey={sortKey}
            initialSortOrder={sortOrder}
            jobSeekers={data.jobSeekers}
            errorMessage={null}
          />
        </div>
      </main>
    </div>
  );
}
