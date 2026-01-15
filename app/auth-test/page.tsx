import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export default async function AuthTestPage() {
  const session = await getServerSession(authOptions);

  return (
    <div style={{ padding: 24 }}>
      <h1>NextAuth v4 動作確認</h1>
      <pre>{JSON.stringify(session, null, 2)}</pre>

      <p style={{ marginTop: 16 }}>
        <a href="/api/auth/signin?callbackUrl=/auth-test">Sign in</a> /{" "}
        <a href="/api/auth/signout?callbackUrl=/auth-test">Sign out</a>
      </p>
    </div>
  );
}
