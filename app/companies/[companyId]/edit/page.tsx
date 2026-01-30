// app/companies/[companyId]/edit/page.tsx
import { cookies, headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import CompanyEditForm from "./CompanyEditForm";

type CompanyDetailDto = {
  id: string;
  name: string;
  industry: string;
  contact: string | null;
  staff: string;
};

async function cookiesToHeader() {
  const store = await cookies();
  return store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`;
}

async function fetchCompanyDetail(companyId: string) {
  const baseUrl = await getBaseUrl();
  const cookie = await cookiesToHeader();

  const res = await fetch(`${baseUrl}/api/companies/${companyId}`, {
    method: "GET",
    headers: { cookie },
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch company detail");

  return (await res.json()) as CompanyDetailDto;
}

type PageProps = { params: Promise<{ companyId: string }> };

export default async function CompanyEditPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const salesUserId = (session as any)?.user?.id as string | undefined;
  if (!salesUserId) redirect("/login");

  const { companyId } = await params;

  const company = await fetchCompanyDetail(companyId);
  if (!company) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl p-6 space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-bold">企業編集</h1>
        <p className="text-sm text-muted-foreground">
          企業情報を更新できます。
        </p>
      </div>

      <CompanyEditForm
        companyId={company.id}
        initial={{
          name: company.name,
          contact: company.contact ?? "",
          industry: company.industry,
          staff: company.staff,
        }}
      />
    </div>
  );
}
