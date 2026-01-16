import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/features/auth/loginSchema";

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
        const parsed = loginSchema.safeParse({
          id: credentials?.id,
          password: credentials?.password,
        });
        if (!parsed.success) return null;

        const user = await prisma.salesUser.findUnique({
          where: { id: parsed.data.id },
          select: { id: true, name: true, password: true, isActive: true },
        });

        if (!user || !user.isActive) return null;

        const ok = await compare(parsed.data.password, user.password);
        if (!ok) return null;

        // NextAuthが要求する形：最低限 id を返す
        return { id: user.id, name: user.name };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // 初回ログイン時だけ user が来る
      if (user) {
        token.userId = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // session.user.id は型拡張して使うのが推奨
        (session.user as any).id = token.userId;
        session.user.name = token.name as string | undefined;
      }
      return session;
    },
  },
};
