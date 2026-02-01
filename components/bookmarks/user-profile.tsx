"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bookmark,
  ChevronUp,
  FolderOpen,
  Keyboard,
  LogOut,
  Moon,
  Monitor,
  Settings,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { usePrivacyStore } from "@/hooks/use-privacy-store";

interface User {
  name: string;
  email: string;
  avatar?: string;
}

interface UserStats {
  bookmarks: number;
  folders: number;
}

interface UserProfileProps {
  user?: User;
  stats?: UserStats;
  onSettings?: () => void;
  onKeyboardShortcuts?: () => void;
  onSignOut?: () => void;
}

// Default mock user - replace with actual auth data
const defaultUser: User = {
  name: "John Doe",
  email: "john@example.com",
  avatar: undefined,
};

const defaultStats: UserStats = {
  bookmarks: 128,
  folders: 12,
};

export function UserProfile({
  user = defaultUser,
  stats = defaultStats,
  onSettings,
  onKeyboardShortcuts,
  onSignOut,
}: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const blurProfile = usePrivacyStore((state) => state.blurProfile);

  useEffect(() => {
    setMounted(true);
  }, []);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative border-t border-sidebar-border p-2">
      {/* Dropdown Menu - appears above the button */}
      <div
        className={cn(
          "absolute bottom-full left-2 right-2 mb-2 origin-bottom",
          "rounded-lg border border-sidebar-border bg-sidebar shadow-lg",
          "transition-all duration-150 ease-out",
          isOpen
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-1 scale-[0.98] opacity-0"
        )}
      >
        {/* User Info Header */}
        <div className="flex items-center gap-3 p-3">
          <Avatar className="size-10">
            <AvatarImage src={user.avatar} alt={user.name} className={cn(blurProfile && "blur-sm")} />
            <AvatarFallback className={cn("bg-sidebar-accent text-sidebar-accent-foreground text-sm font-medium", blurProfile && "blur-sm")}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className={cn("truncate text-sm font-medium text-sidebar-foreground", blurProfile && "blur-sm")}>{user.name}</p>
            <p className={cn("truncate text-xs text-sidebar-foreground/60", blurProfile && "blur-sm")}>{user.email}</p>
          </div>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-1 p-2">
          <StatItem icon={Bookmark} value={stats.bookmarks} label="Bookmarks" />
          <StatItem icon={FolderOpen} value={stats.folders} label="Folders" />
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Quick Actions */}
        <div className="p-1">
          <TooltipProvider delayDuration={300}>
            <MenuItem
              icon={Settings}
              label="Settings"
              onClick={() => {
                onSettings?.();
                setIsOpen(false);
              }}
            />
            <MenuItem
              icon={Keyboard}
              label="Keyboard shortcuts"
              shortcut="?"
              onClick={() => {
                onKeyboardShortcuts?.();
                setIsOpen(false);
              }}
            />
            {mounted && (
              <MenuItem
                icon={
                  theme === "system"
                    ? Monitor
                    : theme === "dark"
                      ? Moon
                      : Sun
                }
                label={
                  theme === "system"
                    ? "System theme"
                    : theme === "dark"
                      ? "Dark mode"
                      : "Light mode"
                }
                onClick={toggleTheme}
              />
            )}

            <Separator className="my-1 bg-sidebar-border" />

            <MenuItem
              icon={LogOut}
              label="Sign out"
              variant="destructive"
              onClick={() => {
                onSignOut?.();
                setIsOpen(false);
              }}
            />
          </TooltipProvider>
        </div>
      </div>

      {/* Trigger Button - styled like SidebarMenuButton */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md p-2 text-left text-sm",
          "ring-sidebar-ring transition-colors duration-100",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2",
          isOpen && "bg-sidebar-accent text-sidebar-accent-foreground"
        )}
      >
        <Avatar className="size-7 shrink-0">
          <AvatarImage src={user.avatar} alt={user.name} className={cn(blurProfile && "blur-sm")} />
          <AvatarFallback className={cn("bg-sidebar-primary/10 text-sidebar-primary text-xs font-medium", blurProfile && "blur-sm")}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className={cn("truncate text-sm font-medium leading-tight text-sidebar-foreground", blurProfile && "blur-sm")}>
            {user.name}
          </p>
          <p className={cn("truncate text-xs text-sidebar-foreground/60", blurProfile && "blur-sm")}>{user.email}</p>
        </div>
        <ChevronUp
          className={cn(
            "size-4 shrink-0 text-sidebar-foreground/50 transition-transform duration-150",
            isOpen ? "rotate-0" : "rotate-180"
          )}
        />
      </button>
    </div>
  );
}

// Stat item sub-component
interface StatItemProps {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
}

function StatItem({ icon: Icon, value, label }: StatItemProps) {
  return (
    <div className="flex items-center gap-2 rounded-md px-3 py-2 bg-sidebar-accent/50">
      <Icon className="size-4 text-sidebar-foreground/50" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold tabular-nums text-sidebar-foreground">{value}</p>
        <p className="text-[10px] text-sidebar-foreground/50">{label}</p>
      </div>
    </div>
  );
}

// Menu item sub-component - styled like SidebarMenuButton
interface MenuItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  onClick?: () => void;
  variant?: "default" | "destructive";
}

function MenuItem({ icon: Icon, label, shortcut, onClick, variant = "default" }: MenuItemProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm",
            "transition-colors duration-100",
            variant === "default" && [
              "text-sidebar-foreground",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            ],
            variant === "destructive" && [
              "text-destructive",
              "hover:bg-destructive/10",
            ]
          )}
        >
          <Icon className="size-4 shrink-0" />
          <span className="flex-1 text-left">{label}</span>
          {shortcut && (
            <kbd className="ml-auto rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-medium text-sidebar-foreground/60">
              {shortcut}
            </kbd>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
