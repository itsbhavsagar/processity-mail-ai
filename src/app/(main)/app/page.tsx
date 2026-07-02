import { siteConfig } from "@/config/site";

export default function AppPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        {siteConfig.name}
      </h1>
      <p className="max-w-lg text-center text-muted-foreground">
        {siteConfig.description}
      </p>
      <p className="text-sm text-muted-foreground">
        Architecture scaffold ready — features will be added here.
      </p>
    </main>
  );
}
