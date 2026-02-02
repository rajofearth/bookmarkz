"use client";

import { type ReactNode } from "react";
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
  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Tab Content */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === "home" && (
          <div className="absolute inset-0 overflow-y-auto">
            {homeContent}
          </div>
        )}
        {activeTab === "folders" && (
          <div className="absolute inset-0 overflow-hidden">
            {foldersContent}
          </div>
        )}
        {activeTab === "profile" && (
          <div className="absolute inset-0 overflow-hidden">
            {profileContent}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
