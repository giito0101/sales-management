// components/LogoutButton.tsx
"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

type LogoutButtonProps = {
  compact?: boolean;
};

export function LogoutButton({ compact = false }: LogoutButtonProps) {
  return (
    <Button
      variant="outline"
      size={compact ? "sm" : "default"}
      aria-label="ログアウト"
      onClick={() =>
        signOut({
          callbackUrl: "/login", // ログアウト後の遷移先
        })
      }
    >
      {compact ? "出" : "ログアウト"}
    </Button>
  );
}
