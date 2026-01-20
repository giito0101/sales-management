// app/jobseekers/JobSeekerTable.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type JobSeekerRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "NEW" | "INTERVIEWED" | "PROPOSING" | "OFFERED" | "CLOSED";
  updatedAt: string; // ISO
  salesUser: { name: string };
};

function statusLabel(s: JobSeekerRow["status"]) {
  switch (s) {
    case "NEW":
      return "新規";
    case "INTERVIEWED":
      return "面談済";
    case "PROPOSING":
      return "提案中";
    case "OFFERED":
      return "内定";
    case "CLOSED":
      return "終了";
    default:
      return s;
  }
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  // 最小構成：日本語表示
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function JobSeekerTable(props: {
  initialQuery: string;
  initialSortKey: "updatedAt" | "id" | "name";
  initialSortOrder: "asc" | "desc";
  jobSeekers: JobSeekerRow[];
  errorMessage: string | null;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const [q, setQ] = useState(props.initialQuery);
  const [localError, setLocalError] = useState<string | null>(null);

  const currentSortKey =
    (sp.get("sortKey") as "updatedAt" | "id" | "name") ?? props.initialSortKey;
  const currentSortOrder =
    (sp.get("sortOrder") as "asc" | "desc") ?? props.initialSortOrder;

  const error = localError ?? props.errorMessage;

  const buildUrl = (next: {
    q?: string;
    sortKey?: string;
    sortOrder?: string;
  }) => {
    const params = new URLSearchParams(sp.toString());
    if (next.q !== undefined) {
      if (next.q) params.set("q", next.q);
      else params.delete("q");
    }
    if (next.sortKey !== undefined) params.set("sortKey", next.sortKey);
    if (next.sortOrder !== undefined) params.set("sortOrder", next.sortOrder);
    return `/jobseekers?${params.toString()}`;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.length > 255) {
      setLocalError("検索ワードが適切ではありません");
      return;
    }
    setLocalError(null);
    router.push(
      buildUrl({ q, sortKey: currentSortKey, sortOrder: currentSortOrder })
    );
  };

  const toggleSort = (key: "updatedAt" | "id" | "name") => {
    const isSameKey = currentSortKey === key;
    const nextOrder = isSameKey
      ? currentSortOrder === "asc"
        ? "desc"
        : "asc"
      : key === "updatedAt"
      ? "desc"
      : "asc";
    router.push(buildUrl({ sortKey: key, sortOrder: nextOrder }));
  };

  const sortIndicator = useMemo(() => {
    const arrow = currentSortOrder === "asc" ? "▲" : "▼";
    return (key: string) => (currentSortKey === key ? ` ${arrow}` : "");
  }, [currentSortKey, currentSortOrder]);

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="flex gap-2 items-start">
        <div className="flex-1">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="氏名 / メール / 電話 / 担当者で検索"
            maxLength={300} // UI上は少し余裕、判定は255
          />
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
        <Button type="submit">検索</Button>
      </form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[220px]">
                <button
                  type="button"
                  className="font-medium hover:underline"
                  onClick={() => toggleSort("id")}
                >
                  ID{sortIndicator("id")}
                </button>
              </TableHead>
              <TableHead className="w-[160px]">
                <button
                  type="button"
                  className="font-medium hover:underline"
                  onClick={() => toggleSort("name")}
                >
                  氏名{sortIndicator("name")}
                </button>
              </TableHead>
              <TableHead>メールアドレス</TableHead>
              <TableHead className="w-[140px]">電話番号</TableHead>
              <TableHead className="w-[140px]">担当者名</TableHead>
              <TableHead className="w-[110px]">ステータス</TableHead>
              <TableHead className="w-[160px]">
                <button
                  type="button"
                  className="font-medium hover:underline"
                  onClick={() => toggleSort("updatedAt")}
                >
                  最終更新日{sortIndicator("updatedAt")}
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {props.jobSeekers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  表示する求職者がありません
                </TableCell>
              </TableRow>
            ) : (
              props.jobSeekers.map((js) => (
                <TableRow
                  key={js.id}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="font-mono text-xs">
                    <Link
                      className="hover:underline"
                      href={`/jobseekers/${js.id}`}
                    >
                      {js.id}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      className="hover:underline"
                      href={`/jobseekers/${js.id}`}
                    >
                      {js.name}
                    </Link>
                  </TableCell>
                  <TableCell>{js.email}</TableCell>
                  <TableCell>{js.phone}</TableCell>
                  <TableCell>{js.salesUser.name}</TableCell>
                  <TableCell>{statusLabel(js.status)}</TableCell>
                  <TableCell>{formatDateTime(js.updatedAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
