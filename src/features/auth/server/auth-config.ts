import type { NextAuthOptions } from "next-auth";

import { refreshGoogleAccessToken } from "@/features/auth/server/refresh-google-access-token";
import { googleProvider } from "@/features/auth/services/google-provider";
import { upsertUser } from "@/features/gmail/server/gmail-sync.repository";
import { registerWatch } from "@/features/gmail/server/gmail-watch";

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
  events: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return;
      }

      const email = user.email;
      const refreshToken = account.refresh_token;
      const accessToken = account.access_token;

      if (!email || !refreshToken || !accessToken) {
        return;
      }

      // Persist first so a failed watch can be retried later by the renewal
      // job; wrap the whole flow so sign-in never fails on a Gmail/Pub-Sub error.
      try {
        await upsertUser({
          email,
          googleSub: account.providerAccountId,
          refreshToken,
        });
        await registerWatch(email, accessToken);
      } catch (error) {
        console.error(
          `[gmail-watch] Watch registration failed for ${email}; sign-in continues. ` +
            `Verify the Pub/Sub topic "${process.env.GMAIL_PUBSUB_TOPIC}" exists in project ` +
            `"${process.env.GOOGLE_CLOUD_PROJECT}" and that gmail-api-push@system.gserviceaccount.com ` +
            `has the Pub/Sub Publisher role on it.`,
          error,
        );
      }
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthOptions;
