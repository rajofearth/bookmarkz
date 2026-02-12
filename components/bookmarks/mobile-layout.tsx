"use client";

import type { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { BottomNav } from "./bottom-nav";

type Tab = "home" | "folders" | "profile";

interface MobileLayoutProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  homeContent: ReactNode;
  foldersContent: ReactNode;
  profileContent: ReactNode;
}

export function MobileLayout({
  activeTab,
  onTabChange,
  homeContent,
  foldersContent,
  profileContent,
}: MobileLayoutProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    // On desktop, don't render anything (desktop layout is handled separately)
    return null;
  }

  // On mobile, render tab-based layout with bottom nav
  // Use h-dvh (100dvh) instead of h-screen - 100vh is broken on mobile (address bar)
  return (
    <div className="flex flex-col h-dvh w-full bg-background text-foreground overflow-hidden">
      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <div className="absolute inset-0 flex flex-col min-h-0 overflow-hidden">
          {activeTab === "home" && homeContent}
          {activeTab === "folders" && foldersContent}
          {activeTab === "profile" && profileContent}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
