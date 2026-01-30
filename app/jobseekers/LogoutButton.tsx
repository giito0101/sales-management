// app/jobseekers/LogoutButton.tsx
"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <Button
      variant="outline"
      onClick={() =>
        signOut({
          callbackUrl: "/login", // ログアウト後の遷移先
        })
      }
    >
      ログアウト
    </Button>
  );
}
