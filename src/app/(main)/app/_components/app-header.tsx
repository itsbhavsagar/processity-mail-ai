import { FiMail } from "react-icons/fi";

import {
  UserProfileMenu,
  type UserProfileMenuUser,
} from "@/features/auth/components/user-profile-menu";
import { siteConfig } from "@/config/site";

interface AppHeaderProps {
  search?: React.ReactNode;
  user?: UserProfileMenuUser;
}

export function AppHeader({ search, user }: AppHeaderProps) {
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

        {search ? (
          <div className="mx-auto hidden w-full max-w-xl md:block">
            {search}
          </div>
        ) : null}

        {user ? <UserProfileMenu user={user} /> : null}
      </div>
    </header>
  );
}
