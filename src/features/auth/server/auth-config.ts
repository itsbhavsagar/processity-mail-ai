import type { NextAuthOptions } from "next-auth";

import { googleProvider } from "@/features/auth/services/google-provider";

export const authSecret = process.env.NEXTAUTH_SECRET;

if (!authSecret) {
  throw new Error("NEXTAUTH_SECRET is not configured.");
}

export const authConfig = {
  secret: authSecret,
  providers: [googleProvider],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthOptions;
