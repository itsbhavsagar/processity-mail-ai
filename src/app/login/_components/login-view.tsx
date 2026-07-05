"use client";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { FiCheck, FiMail } from "react-icons/fi";

import { siteConfig } from "@/config/site";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui";

const capabilities = [
  "Read and reply across your Gmail in one place",
  "Search your inbox in plain language",
  "Draft and send with an AI copilot",
];

export function LoginView() {
  return (
    <main className="flex flex-1 items-center justify-center p-6 sm:p-8">
      <div className="w-full max-w-sm animate-in fade-in duration-500">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-4 text-center">
            <span
              aria-hidden
              className="mx-auto inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"
            >
              <FiMail className="size-5" />
            </span>
            <div className="space-y-1.5">
              <CardTitle className="text-xl font-semibold tracking-tight">
                Sign in to {siteConfig.name}
              </CardTitle>
              <CardDescription className="text-sm">
                An AI-native email workspace for your Gmail.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full gap-2.5 text-sm font-medium"
              onClick={() => signIn("google", { callbackUrl: "/app" })}
            >
              <FcGoogle className="size-5" aria-hidden />
              Continue with Google
            </Button>

            <div className="h-px w-full bg-border" />

            <ul className="space-y-2.5">
              {capabilities.map((capability) => (
                <li
                  key={capability}
                  className="flex items-start gap-2.5 text-sm text-muted-foreground"
                >
                  <FiCheck
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden
                  />
                  <span>{capability}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <p className="mt-4 px-2 text-center text-xs leading-relaxed text-muted-foreground">
          {siteConfig.name} requests access to read and send email on your
          behalf. You can revoke access anytime from your Google Account.
        </p>
      </div>
    </main>
  );
}
