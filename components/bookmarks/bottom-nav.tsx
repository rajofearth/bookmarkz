"use client";

import { BookmarkIcon, FolderIcon, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "home" | "folders" | "profile";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    {
      id: "home" as Tab,
      label: "Home",
      icon: BookmarkIcon,
    },
    {
      id: "folders" as Tab,
      label: "Folders",
      icon: FolderIcon,
    },
    {
      id: "profile" as Tab,
      label: "Profile",
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="grid grid-cols-3 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                "active:bg-muted/50",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("size-5", isActive && "scale-110")} />
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isActive && "font-semibold",
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
