"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      style={{
        marginTop: 16,
        padding: "8px 16px",
        borderRadius: 6,
        background: "#e11d48",
        color: "white",
        fontWeight: 600,
      }}
    >
      ログアウト
    </button>
  );
}
