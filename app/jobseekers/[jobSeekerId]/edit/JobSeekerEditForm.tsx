// app/jobseekers/[jobSeekerId]/edit/JobSeekerEditForm.tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  jobSeekerEditSchema,
  type JobSeekerEditInput,
} from "@/features/jobseekers/jobSeekerEditSchema";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  jobSeekerId: string;
  initial: JobSeekerEditInput & {
    status: "NEW" | "INTERVIEWED" | "PROPOSING" | "OFFERED" | "CLOSED";
  };
  salesUsers: { id: string; name: string }[];
};

const STATUS_LABEL: Record<Props["initial"]["status"], string> = {
  NEW: "新規",
  INTERVIEWED: "面談済",
  PROPOSING: "提案中",
  OFFERED: "内定",
  CLOSED: "終了",
};

export default function JobSeekerEditForm({
  jobSeekerId,
  initial,
  salesUsers,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [issues, setIssues] = useState<{ path: (string | number)[]; message: string }[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: initial.name,
    age: initial.age ?? null,
    email: initial.email,
    phone: initial.phone,
    desiredJobType: initial.desiredJobType,
    desiredLocation: initial.desiredLocation,
    salesUserId: initial.salesUserId ?? "",
    status: initial.status,
    memo: initial.memo ?? "",
  });

  const issueMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const i of issues) {
      const key = String(i.path?.[0] ?? "");
      if (!m.has(key)) m.set(key, i.message);
    }
    return m;
  }, [issues]);

  function buildPayload() {
    const age =
      form.age === null || form.age === ("" as any)
        ? null
        : typeof form.age === "string"
          ? Number(form.age)
          : form.age;

    return {
      ...form,
      age,
      memo: form.memo === "" ? null : form.memo,
      salesUserId: form.salesUserId || undefined,
      status: form.status || undefined,
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIssues([]);
    setServerError(null);

    if (isPending) return;

    const parsed = jobSeekerEditSchema.safeParse(buildPayload());
    if (!parsed.success) {
      setIssues(parsed.error.issues);
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/jobseekers/${jobSeekerId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (res.status === 422 && body?.issues) {
          setIssues(body.issues);
          return;
        }
        setServerError(
          body?.message ?? `更新に失敗しました（${res.status}）`,
        );
        return;
      }

      router.push(`/jobseekers/${jobSeekerId}?updated=1`);
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
        <label className="text-sm font-medium">氏名</label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        {issueMap.get("name") && (
          <p className="text-sm text-destructive">{issueMap.get("name")}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">年齢</label>
        <Input
          inputMode="numeric"
          value={form.age ?? ""}
          onChange={(e) => setForm({ ...form, age: e.target.value as any })}
        />
        {issueMap.get("age") && (
          <p className="text-sm text-destructive">{issueMap.get("age")}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">メールアドレス</label>
        <Input
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        {issueMap.get("email") && (
          <p className="text-sm text-destructive">{issueMap.get("email")}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">電話番号</label>
        <Input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        {issueMap.get("phone") && (
          <p className="text-sm text-destructive">{issueMap.get("phone")}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">希望職種</label>
        <Input
          value={form.desiredJobType}
          onChange={(e) => setForm({ ...form, desiredJobType: e.target.value })}
        />
        {issueMap.get("desiredJobType") && (
          <p className="text-sm text-destructive">
            {issueMap.get("desiredJobType")}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">希望勤務地</label>
        <Input
          value={form.desiredLocation}
          onChange={(e) =>
            setForm({ ...form, desiredLocation: e.target.value })
          }
        />
        {issueMap.get("desiredLocation") && (
          <p className="text-sm text-destructive">
            {issueMap.get("desiredLocation")}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">担当者</label>
        <Select
          value={form.salesUserId}
          onValueChange={(v) => setForm({ ...form, salesUserId: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="担当者を選択" />
          </SelectTrigger>
          <SelectContent>
            {salesUsers.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {issueMap.get("salesUserId") && (
          <p className="text-sm text-destructive">
            {issueMap.get("salesUserId")}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">ステータス</label>
        <Select
          value={form.status}
          onValueChange={(v) => setForm({ ...form, status: v as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(
              Object.keys(STATUS_LABEL) as Array<keyof typeof STATUS_LABEL>
            ).map((k) => (
              <SelectItem key={k} value={k}>
                {STATUS_LABEL[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          遷移ルール違反は保存時に 400 になります。
        </p>
        {issueMap.get("status") && (
          <p className="text-sm text-destructive">{issueMap.get("status")}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">メモ</label>
        <Textarea
          rows={6}
          value={form.memo ?? ""}
          onChange={(e) => setForm({ ...form, memo: e.target.value })}
        />
        {issueMap.get("memo") && (
          <p className="text-sm text-destructive">{issueMap.get("memo")}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          戻る
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "保存中…" : "保存"}
        </Button>
      </div>
    </form>
  );
}
