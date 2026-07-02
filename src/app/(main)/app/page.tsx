import { siteConfig } from "@/config/site";

export default function AppPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        {siteConfig.name}
      </h1>
      <p className="text-muted-foreground">AI-native email workspace.</p>
    </main>
  );
}
