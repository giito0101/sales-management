"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { loginSchema } from "@/features/auth/loginSchema";

// shadcn（導入済み想定）
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FieldErrors = Partial<Record<"id" | "password", string>>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 未認証で保護ページへ行った場合、NextAuthが callbackUrl を付けることが多い
  const callbackUrl = useMemo(() => {
    return searchParams.get("callbackUrl") ?? "/jobseekers";
  }, [searchParams]);

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse({ id, password });
    if (!parsed.success) {
      const fe: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "id" || key === "password") fe[key] = issue.message;
      }
      setFieldErrors(fe);
      return;
    }
    setFieldErrors({});

    setPending(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        id: parsed.data.id,
        password: parsed.data.password,
        callbackUrl,
      });

      if (!res?.ok) {
        setFormError("IDまたはパスワードが違います");
        return;
      }

      // res.url が返ることもあるが、固定でOKなら jobseekers へ
      router.push(res.url ?? "/jobseekers");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-dvh grid place-items-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>ログイン</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="id">ID</Label>
              <Input
                id="id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                autoComplete="username"
              />
              {fieldErrors.id && (
                <p className="text-sm text-red-600">{fieldErrors.id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              {fieldErrors.password && (
                <p className="text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "ログイン中..." : "ログイン"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
