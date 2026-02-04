// app/companies/page.tsx
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import CompanyTable from "./CompanyTable";
import { companySearchParamsSchema } from "@/features/companies/searchSchema";
import { authOptions } from "@/lib/auth";
import { ListSidebar } from "@/components/ListSidebar";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function PageHeader() {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold">企業一覧</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          企業を検索・並び替えできます。
        </p>
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

async function fetchCompanies(params: {
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
    `${process.env.NEXTAUTH_URL ?? ""}/api/companies?${qs.toString()}`,
    {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    },
  );

  return res;
}

export default async function CompaniesPage({ searchParams }: PageProps) {
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

  const parsed = companySearchParamsSchema.safeParse(raw);

  if (!parsed.success) {
    return (
      <div className="flex h-screen overflow-hidden">
        <ListSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto w-full max-w-6xl space-y-4">
            <PageHeader />
            <CompanyTable
              initialQuery={raw.q ?? ""}
              initialSortKey="id"
              initialSortOrder="asc"
              companies={[]}
              errorMessage="検索ワードが適切ではありません"
            />
          </div>
        </main>
      </div>
    );
  }

  const q = parsed.data.q ?? "";
  const sortKey = parsed.data.sortKey ?? "id";
  const sortOrder = parsed.data.sortOrder ?? "asc";

  const res = await fetchCompanies({ q, sortKey, sortOrder });

  if (!res.ok) {
    return (
      <div className="flex h-screen overflow-hidden">
        <ListSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto w-full max-w-6xl space-y-4">
            <PageHeader />
            <CompanyTable
              initialQuery={q}
              initialSortKey={sortKey}
              initialSortOrder={sortOrder}
              companies={[]}
              errorMessage="検索ワードが適切ではありません"
            />
          </div>
        </main>
      </div>
    );
  }

  const data = (await res.json()) as { companies: any[] };

  return (
    <div className="flex h-screen overflow-hidden">
      <ListSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto w-full max-w-6xl space-y-4">
          <PageHeader />
          <CompanyTable
            initialQuery={q}
            initialSortKey={sortKey}
            initialSortOrder={sortOrder}
            companies={data.companies}
            errorMessage={null}
          />
        </div>
      </main>
    </div>
  );
}
