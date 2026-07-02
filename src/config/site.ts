import { env } from "./env";

export const siteConfig = {
  name: env.NEXT_PUBLIC_APP_NAME,
  description:
    "AI-native email application where a conversational assistant controls the UI.",
  url: env.NEXT_PUBLIC_APP_URL,
} as const;
