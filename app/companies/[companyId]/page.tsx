// app/companies/[companyId]/page.tsx
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { authOptions } from "@/lib/auth";

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

type PageProps = {
  params: Promise<{ companyId: string }>;
  searchParams?: Promise<{ updated?: string }>;
};

export default async function CompanyDetailPage({
  params,
  searchParams,
}: PageProps) {
  const session = await getServerSession(authOptions);
  const salesUserId = (session as any)?.user.id as string | undefined;

  if (!salesUserId) redirect("/login");

  const { companyId } = await params;
  const query = (await searchParams) ?? {};
  const updated = query.updated === "1";

  const company = await fetchCompanyDetail(companyId);
  if (!company) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl p-6 space-y-6">
      {updated && (
        <div className="rounded-md border p-3 text-sm">更新しました。</div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">企業詳細</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            企業情報を確認できます。
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/companies">戻る</Link>
          </Button>
          <Button asChild>
            <Link href={`/companies/${company.id}/edit`}>編集</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>企業詳細</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="w-40">ID</TableHead>
                <TableCell>{company.id}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>企業名</TableHead>
                <TableCell>{company.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>連絡先</TableHead>
                <TableCell>{company.contact ?? "—"}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>業種</TableHead>
                <TableCell>{company.industry}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>担当者</TableHead>
                <TableCell>{company.staff}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
