// app/companies/[companyId]/edit/CompanyEditForm.tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { companyEditSchema } from "@/features/companies/companyEditSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  companyId: string;
  initial: {
    name: string;
    contact: string;
    industry: string;
    staff: string;
  };
};

export default function CompanyEditForm({ companyId, initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [issues, setIssues] = useState<{ path: PropertyKey[]; message: string }[]>(
    [],
  );
  const [serverError, setServerError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: initial.name,
    contact: initial.contact,
    industry: initial.industry,
    staff: initial.staff,
  });

  const issueMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const i of issues) {
      const key = String(i.path?.[0] ?? "");
      if (!m.has(key)) m.set(key, i.message);
    }
    return m;
  }, [issues]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIssues([]);
    setServerError(null);

    if (isPending) return;

    const parsed = companyEditSchema.safeParse({
      name: form.name,
      contact: form.contact,
      industry: form.industry,
      staff: form.staff,
    });

    if (!parsed.success) {
      setIssues(parsed.error.issues);
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (res.status === 400 && body?.issues) {
          setIssues(body.issues);
          return;
        }
        setServerError(body?.message ?? `更新に失敗しました（${res.status}）`);
        return;
      }

      router.push(`/companies/${companyId}?updated=1`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {serverError && (
        <div className="rounded-md border border-destructive p-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">企業名（必須）</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        {issueMap.get("name") && (
          <p className="text-sm text-destructive">{issueMap.get("name")}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact">連絡先（任意）</Label>
        <Textarea
          id="contact"
          value={form.contact}
          onChange={(e) => setForm({ ...form, contact: e.target.value })}
          rows={4}
        />
        {issueMap.get("contact") && (
          <p className="text-sm text-destructive">{issueMap.get("contact")}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="industry">業種（必須）</Label>
        <Input
          id="industry"
          value={form.industry}
          onChange={(e) => setForm({ ...form, industry: e.target.value })}
        />
        {issueMap.get("industry") && (
          <p className="text-sm text-destructive">{issueMap.get("industry")}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="staff">担当者（必須）</Label>
        <Input
          id="staff"
          value={form.staff}
          onChange={(e) => setForm({ ...form, staff: e.target.value })}
        />
        {issueMap.get("staff") && (
          <p className="text-sm text-destructive">{issueMap.get("staff")}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/companies/${companyId}`)}
          disabled={isPending}
        >
          戻る
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "保存中..." : "保存"}
        </Button>
      </div>
    </form>
  );
}
