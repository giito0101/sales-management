import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/features/auth/loginSchema";

type Credentials = { id: string; password: string };

export async function authorizeCredentials(
  credentials: Credentials | undefined
) {
  if (!credentials?.id || !credentials?.password) return null;

  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) return null;

  const user = await prisma.salesUser.findUnique({
    where: { id: credentials.id },
    select: { id: true, name: true, password: true, isActive: true },
  });

  if (!user || !user.isActive) return null;

  const ok = await compare(credentials.password, user.password);
  if (!ok) return null;

  // ここで返した id/name が callbacks に渡る
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
        const c = credentials as unknown as Credentials | undefined;
        return authorizeCredentials(c);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // 初回ログイン時だけ user が入る
      if (user) {
        token.id = (user as any).id; // module augmentation後は any不要にできる
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      // session.user を拡張して id を入れる
      if (session.user) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
};
