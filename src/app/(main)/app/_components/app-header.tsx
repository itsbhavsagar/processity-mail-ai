import { getServerSession } from "next-auth";
import { FiMail, FiSearch } from "react-icons/fi";

import { UserProfileMenu } from "@/features/auth/components/user-profile-menu";
import { authConfig } from "@/features/auth/server/auth-config";
import { siteConfig } from "@/config/site";
import { Input } from "@/shared/ui";

export async function AppHeader() {
  const session = await getServerSession(authConfig);
  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 shrink-0 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/75 sm:px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <FiMail className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            {siteConfig.name}
          </span>
        </div>

        <div className="relative mx-auto hidden w-full max-w-xl md:block">
          <FiSearch
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="Search workspace"
            placeholder="Search emails..."
            className="h-9 bg-background pl-9"
          />
        </div>

        {user ? <UserProfileMenu user={user} /> : null}
      </div>
    </header>
  );
}
