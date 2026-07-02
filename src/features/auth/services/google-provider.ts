import Google from "next-auth/providers/google";

export const googleProvider = Google({
  clientId: process.env.GOOGLE_CLIENT_ID ?? "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  authorization: {
    params: {
      scope:
        "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send",
      access_type: "offline",
      prompt: "consent",
    },
  },
});
