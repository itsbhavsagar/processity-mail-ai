"use client";

import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { FiCheck, FiMail } from "react-icons/fi";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui";

const trustPoints = [
  "Understand long threads instantly",
  "Draft replies in seconds",
  "Search your inbox with natural language",
  "Built for professionals",
];

export function LoginView() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden p-6 sm:p-8">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="absolute left-1/2 top-1/2 h-136 w-136 -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-br from-primary/20 via-primary/5 to-transparent blur-3xl" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="border-border/70 bg-card/90 shadow-xl backdrop-blur">
          <CardHeader className="space-y-3">
           
            <CardTitle className="flex items-center gap-2 text-2xl">
              <FiMail className="size-5 text-primary" />
              CommandMail
            </CardTitle>
            <CardDescription>
              AI-native email workspace built for modern professionals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <motion.div whileHover={{ y: -1 }} transition={{ duration: 0.15 }}>
              <Button
                type="button"
                className="h-11 w-full text-sm"
                onClick={() => signIn("google", { callbackUrl: "/app" })}
              >
                Continue with Google
              </Button>
            </motion.div>

            <div className="h-px w-full bg-border" />

            <ul className="space-y-2.5">
              {trustPoints.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <FiCheck className="size-4 text-primary" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
