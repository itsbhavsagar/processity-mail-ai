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
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthOptions;
