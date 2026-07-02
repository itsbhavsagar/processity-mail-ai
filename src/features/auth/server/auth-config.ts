import type { NextAuthOptions } from "next-auth";

import { refreshGoogleAccessToken } from "@/features/auth/server/refresh-google-access-token";
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
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token ?? token.refreshToken,
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 3600 * 1000,
          error: undefined,
        };
      }

      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }

      return refreshGoogleAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthOptions;
