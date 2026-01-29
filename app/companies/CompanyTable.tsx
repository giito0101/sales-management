// app/companies/CompanyTable.tsx
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
import { companySearchParamsSchema } from "@/features/companies/searchSchema";
import {
  buildCompanyListUrl,
  getNextSortOrder,
  type CompanyRow,
  type SortKey,
  type SortOrder,
} from "./companyTableUtils";

export default function CompanyTable(props: {
  initialQuery: string;
  initialSortKey: SortKey;
  initialSortOrder: SortOrder;
  companies: CompanyRow[];
  errorMessage: string | null;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const [q, setQ] = useState(props.initialQuery);
  const [localError, setLocalError] = useState<string | null>(null);

  const currentSortKey = (sp.get("sortKey") as SortKey) ?? props.initialSortKey;
  const currentSortOrder =
    (sp.get("sortOrder") as SortOrder) ?? props.initialSortOrder;

  const error = localError ?? props.errorMessage;

  const buildUrl = (next: {
    q?: string;
    sortKey?: SortKey;
    sortOrder?: SortOrder;
  }) => buildCompanyListUrl(sp.toString(), next);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = companySearchParamsSchema.safeParse({ q });
    if (!validation.success) {
      const message =
        validation.error.flatten().fieldErrors.q?.[0] ??
        "検索ワードが適切ではありません";
      setLocalError(message);
      return;
    }
    setLocalError(null);
    router.push(
      buildUrl({ q, sortKey: currentSortKey, sortOrder: currentSortOrder }),
    );
  };

  const toggleSort = (key: SortKey) => {
    const nextOrder = getNextSortOrder({
      currentSortKey,
      currentSortOrder,
      nextKey: key,
    });
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
            placeholder="企業名 / 連絡先 / 業種 / 担当者で検索"
            maxLength={300}
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
              <TableHead className="w-[220px]">
                <button
                  type="button"
                  className="font-medium hover:underline"
                  onClick={() => toggleSort("name")}
                >
                  企業名{sortIndicator("name")}
                </button>
              </TableHead>
              <TableHead>連絡先</TableHead>
              <TableHead className="w-[180px]">業種</TableHead>
              <TableHead className="w-[160px]">担当者</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {props.companies.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  表示する企業がありません
                </TableCell>
              </TableRow>
            ) : (
              props.companies.map((company) => (
                <TableRow
                  key={company.id}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="font-mono text-xs">
                    <Link
                      className="hover:underline"
                      href={`/companies/${company.id}`}
                    >
                      {company.id}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      className="hover:underline"
                      href={`/companies/${company.id}`}
                    >
                      {company.name}
                    </Link>
                  </TableCell>
                  <TableCell>{company.contact ?? "-"}</TableCell>
                  <TableCell>{company.industry}</TableCell>
                  <TableCell>{company.staff}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
