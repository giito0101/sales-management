import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/features/auth/loginSchema";

type Credentials = { id: string; password: string };

export async function authorizeCredentials(
  credentials: Credentials | undefined
) {
  // credentials欠け
  if (!credentials?.id || !credentials?.password) return null;

  // Zodで弾く（任意：UI側で既に弾いてても、ここで守ると堅牢）
  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) return null;

  const user = await prisma.salesUser.findUnique({
    where: { id: credentials.id },
    select: { id: true, name: true, password: true, isActive: true },
  });

  // not found / inactive
  if (!user || !user.isActive) return null;

  // mismatch
  const ok = await compare(credentials.password, user.password);
  if (!ok) return null;

  // ✅ password を返さない
  return { id: user.id, name: user.name };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        id: { label: "ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // NextAuthはRecord形式で渡してくるので型を寄せる
        const c = credentials as unknown as Credentials | undefined;
        return authorizeCredentials(c);
      },
    }),
  ],
};
