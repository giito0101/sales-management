"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// shadcn を使う場合（あなたの構成に合わせて import 先を調整）
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = { created: boolean };

type ApiIssue = { path: (string | number)[]; message: string };

export default function JobSeekerCreateForm({ created }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 最小：ローカルstate（React Hook Formは使わない）
  const [form, setForm] = useState({
    name: "",
    age: "",
    email: "",
    phone: "",
    desiredJobType: "",
    desiredLocation: "",
    memo: "",
  });

  const [issues, setIssues] = useState<ApiIssue[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  // ✅ PRG: ?created=1 で表示（toastがあるなら toast に置換でOK）
  useEffect(() => {
    if (created) {
      // 画面にメッセージ表示（最小）
      // ここを shadcn の toast に差し替えてもOK
    }
  }, [created]);

  const issueMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const i of issues) {
      const key = String(i.path?.[0] ?? "");
      if (!m.has(key)) m.set(key, i.message);
    }
    return m;
  }, [issues]);

  const onChange =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((p) => ({ ...p, [key]: e.target.value }));
    };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIssues([]);
    setServerError(null);

    // 二重送信防止：pending中は送らない
    if (isPending) return;

    startTransition(async () => {
      const res = await fetch("/api/jobseekers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          age: form.age,
          email: form.email,
          phone: form.phone,
          desiredJobType: form.desiredJobType,
          desiredLocation: form.desiredLocation,
          memo: form.memo,
        }),
      });

      if (res.status === 401) {
        // セッション切れ等
        router.replace("/login");
        return;
      }

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 422 && data?.issues) {
          setIssues(data.issues as ApiIssue[]);
          return;
        }
        setServerError(data?.message ?? "作成に失敗しました");
        return;
      }

      // ✅ 成功: メッセージ表示 + /jobseekers/new?created=1 にリダイレクト（PRG）
      // これでリロードしても再POSTされない
      router.replace("/jobseekers/new?created=1");
      router.refresh();

      // 入力クリア（任意）
      setForm({
        name: "",
        age: "",
        email: "",
        phone: "",
        desiredJobType: "",
        desiredLocation: "",
        memo: "",
      });
    });
  };

  return (
    <div className="mt-6">
      {created && (
        <div className="mb-4 rounded-md border p-3 text-sm">作成しました。</div>
      )}

      {serverError && (
        <div className="mb-4 rounded-md border border-destructive p-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">氏名（必須）</Label>
          <Input id="name" value={form.name} onChange={onChange("name")} />
          {issueMap.get("name") && (
            <p className="text-sm text-destructive">{issueMap.get("name")}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="age">年齢（任意）</Label>
          <Input
            id="age"
            value={form.age}
            onChange={onChange("age")}
            inputMode="numeric"
          />
          {issueMap.get("age") && (
            <p className="text-sm text-destructive">{issueMap.get("age")}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">メールアドレス（必須）</Label>
          <Input id="email" value={form.email} onChange={onChange("email")} />
          {issueMap.get("email") && (
            <p className="text-sm text-destructive">{issueMap.get("email")}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">電話番号（必須）</Label>
          <Input id="phone" value={form.phone} onChange={onChange("phone")} />
          {issueMap.get("phone") && (
            <p className="text-sm text-destructive">{issueMap.get("phone")}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="desiredJobType">希望職種（必須）</Label>
          <Input
            id="desiredJobType"
            value={form.desiredJobType}
            onChange={onChange("desiredJobType")}
          />
          {issueMap.get("desiredJobType") && (
            <p className="text-sm text-destructive">
              {issueMap.get("desiredJobType")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="desiredLocation">希望勤務地（必須）</Label>
          <Input
            id="desiredLocation"
            value={form.desiredLocation}
            onChange={onChange("desiredLocation")}
          />
          {issueMap.get("desiredLocation") && (
            <p className="text-sm text-destructive">
              {issueMap.get("desiredLocation")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="memo">メモ（任意）</Label>
          <Textarea
            id="memo"
            value={form.memo}
            onChange={onChange("memo")}
            rows={6}
          />
          {issueMap.get("memo") && (
            <p className="text-sm text-destructive">{issueMap.get("memo")}</p>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "作成中..." : "作成"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/jobseekers")}
            disabled={isPending}
          >
            戻る
          </Button>
        </div>
      </form>
    </div>
  );
}
