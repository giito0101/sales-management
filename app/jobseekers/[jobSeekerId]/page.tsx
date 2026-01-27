// app/jobseekers/[jobSeekerId]/page.tsx
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  formatDateTime,
  statusLabel,
  type JobSeekerDetailDto,
  type JobSeekerHistoryDto,
} from "./jobSeekerDetailUtils";

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

async function fetchJobSeekerDetail(jobSeekerId: string) {
  const baseUrl = await getBaseUrl();
  const cookie = await cookiesToHeader();

  const res = await fetch(`${baseUrl}/api/jobseekers/${jobSeekerId}`, {
    method: "GET",
    headers: { cookie },
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch jobseeker detail");

  return (await res.json()) as JobSeekerDetailDto;
}

async function fetchJobSeekerHistory(jobSeekerId: string) {
  const baseUrl = await getBaseUrl();
  const cookie = await cookiesToHeader();

  const res = await fetch(
    `${baseUrl}/api/jobseekers/${jobSeekerId}/history?sort=createdAt_desc`,
    {
      method: "GET",
      headers: { cookie },
      cache: "no-store",
    },
  );

  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch jobseeker history");

  return (await res.json()) as JobSeekerHistoryDto[];
}

type PageProps = {
  params: Promise<{ jobSeekerId: string }>;
};

export default async function JobSeekerDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const salesUserId = (session as any)?.user.id as string | undefined;

  if (!salesUserId) redirect("/login");

  const { jobSeekerId } = await params;

  const [detail, histories] = await Promise.all([
    fetchJobSeekerDetail(jobSeekerId),
    fetchJobSeekerHistory(jobSeekerId),
  ]);

  if (!detail || !histories) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">求職者 詳細</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            求職者情報と履歴を確認できます。
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/jobseekers">戻る</Link>
          </Button>
          <Button asChild>
            <Link href={`/jobseekers/${detail.id}/edit`}>編集</Link>
          </Button>
        </div>
      </div>

      {/* 求職者詳細 */}
      <Card>
        <CardHeader>
          <CardTitle>求職者詳細</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="w-48">氏名</TableHead>
                <TableCell>{detail.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>年齢</TableHead>
                <TableCell>{detail.age ?? "—"}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>メールアドレス</TableHead>
                <TableCell>{detail.email}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>電話番号</TableHead>
                <TableCell>{detail.phone}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>希望職種</TableHead>
                <TableCell>{detail.desiredJobType}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>希望勤務地</TableHead>
                <TableCell>{detail.desiredLocation}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>担当者名</TableHead>
                <TableCell>{detail.salesUserName}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>ステータス</TableHead>
                <TableCell>{statusLabel(detail.status)}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>最終更新日</TableHead>
                <TableCell>{formatDateTime(detail.updatedAt)}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>メモ</TableHead>
                <TableCell className="whitespace-pre-wrap">
                  {detail.memo ?? "—"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 求職者履歴 */}
      <Card>
        <CardHeader>
          <CardTitle>求職者履歴</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">作成日時</TableHead>
                <TableHead className="w-48">担当者名</TableHead>
                <TableHead className="w-32">ステータス</TableHead>
                <TableHead>メモ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {histories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    履歴がありません
                  </TableCell>
                </TableRow>
              ) : (
                histories.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>{formatDateTime(h.createdAt)}</TableCell>
                    <TableCell>{h.salesUserName}</TableCell>
                    <TableCell>{statusLabel(h.status)}</TableCell>
                    <TableCell className="whitespace-pre-wrap">
                      {h.memo ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
