import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authConfig } from "@/features/auth/server/auth-config";
import { Button } from "@/shared/ui";

export default async function LoginPage() {
  const session = await getServerSession(authConfig);

  if (session) {
    redirect("/app");
  }

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">CommandMail</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to continue to your AI-native email workspace.
        </p>
        <form method="get" action="/api/auth/signin/google" className="mt-6">
          <input type="hidden" name="callbackUrl" value="/app" />
          <Button type="submit" className="w-full">
            Continue with Google
          </Button>
        </form>
      </div>
    </main>
  );
}
