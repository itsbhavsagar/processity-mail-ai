"use client";

import { motion } from "framer-motion";

import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import { AssistantPanel } from "./assistant-panel";
import { WorkspaceEmptyState } from "./workspace-empty-state";

export function AppShell() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader />

      <div className="grid flex-1 gap-4 p-4 sm:p-6 md:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_320px]">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <AppSidebar />
        </motion.div>

        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <WorkspaceEmptyState />
        </motion.main>

        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
          className="hidden xl:block"
        >
          <AssistantPanel />
        </motion.div>
      </div>
    </div>
  );
}
