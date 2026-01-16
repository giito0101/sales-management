import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

export default async function ApplicantsPage() {
  const session = await getServerSession(authOptions);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>求職者一覧</h1>

      <LogoutButton />

      <pre
        style={{
          marginTop: 16,
          background: "#f6f6f6",
          padding: 12,
          borderRadius: 8,
        }}
      >
        {JSON.stringify(session, null, 2)}
      </pre>
    </div>
  );
}
