// app/jobseekers/page.tsx
import { cookies } from "next/headers";
import Link from "next/link";
import { z } from "zod";
import JobSeekerTable from "./JobSeekerTable";
import { Button } from "@/components/ui/button"; // shadcn Button
import { jobSeekerSearchParamsSchema } from "@/features/jobseekers/searchSchema";

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

      {/* 右上アクション群 */}
      <div className="flex items-center gap-2">
        <Button asChild>
          <Link href="/jobseekers/new">新規作成</Link>
        </Button>

        {/* ✅ ログアウト（NextAuth標準） */}
        <form action="/api/auth/signout" method="POST">
          {/* NextAuthはCSRFを要求する構成もある。
             その場合は下の「CSRF対応版」を使ってね */}
          <Button type="submit" variant="outline">
            ログアウト
          </Button>
        </form>
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
      <div className="p-6 space-y-4">
        <PageHeader />
        <JobSeekerTable
          initialQuery={raw.q ?? ""}
          initialSortKey="updatedAt"
          initialSortOrder="desc"
          jobSeekers={[]}
          errorMessage="検索ワードが適切ではありません"
        />
      </div>
    );
  }

  const q = parsed.data.q ?? "";
  const sortKey = parsed.data.sortKey ?? "updatedAt";
  const sortOrder = parsed.data.sortOrder ?? "desc";

  const res = await fetchJobSeekers({ q, sortKey, sortOrder });

  if (!res.ok) {
    return (
      <div className="p-6 space-y-4">
        <PageHeader />
        <JobSeekerTable
          initialQuery={q}
          initialSortKey={sortKey}
          initialSortOrder={sortOrder}
          jobSeekers={[]}
          errorMessage="検索ワードが適切ではありません"
        />
      </div>
    );
  }

  const data = (await res.json()) as { jobSeekers: any[] };

  return (
    <div className="p-6 space-y-4">
      <PageHeader />
      <JobSeekerTable
        initialQuery={q}
        initialSortKey={sortKey}
        initialSortOrder={sortOrder}
        jobSeekers={data.jobSeekers}
        errorMessage={null}
      />
    </div>
  );
}
