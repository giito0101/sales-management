// app/jobseekers/page.tsx
import { cookies } from "next/headers";
import { z } from "zod";
import JobSeekerTable from "./JobSeekerTable";

const searchParamsSchema = z.object({
  q: z.string().max(255).optional(),
  sortKey: z.enum(["updatedAt", "id", "name"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

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
    }
  );

  return res;
}

export default async function JobSeekersPage({ searchParams }: PageProps) {
  // ✅ ここがポイント：Promiseをunwrap
  const sp = (searchParams ? await searchParams : {}) as Record<
    string,
    string | string[] | undefined
  >;

  const raw = {
    q: typeof sp.q === "string" ? sp.q : undefined,
    sortKey: typeof sp.sortKey === "string" ? sp.sortKey : undefined,
    sortOrder: typeof sp.sortOrder === "string" ? sp.sortOrder : undefined,
  };

  const parsed = searchParamsSchema.safeParse(raw);

  if (!parsed.success) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-xl font-bold">求職者一覧</h1>
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
        <h1 className="text-xl font-bold">求職者一覧</h1>
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
      <h1 className="text-xl font-bold">求職者一覧</h1>
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
