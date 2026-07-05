"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

interface ProvidersProps {
  children: React.ReactNode;
}

function AppToaster() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={(theme as "light" | "dark") ?? "light"}
      richColors
      position="top-right"
      closeButton
    />
  );
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
      <AppToaster />
    </ThemeProvider>
  );
}
