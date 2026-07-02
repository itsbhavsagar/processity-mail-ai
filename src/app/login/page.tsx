import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authConfig } from "@/features/auth/server/auth-config";
import { LoginView } from "./_components/login-view";

export default async function LoginPage() {
  const session = await getServerSession(authConfig);

  if (session) {
    redirect("/app");
  }

  return <LoginView />;
}
