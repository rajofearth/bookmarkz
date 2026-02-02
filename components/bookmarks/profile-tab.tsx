"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Palette,
  Settings as SettingsIcon,
  Bell,
  LogOut,
  Bookmark,
  FolderOpen,
  Mail,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import { useQuery } from "convex/react";
import { useTheme } from "next-themes";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { GeneralSettings } from "@/components/settings/general-settings";
import { NotificationsSettings } from "@/components/settings/notifications-settings";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePrivacyStore } from "@/hooks/use-privacy-store";
import { useGeneralStore } from "@/hooks/use-general-store";

type SettingsSection = "profile" | "appearance" | "general" | "notifications" | null;

export function ProfileTab() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const user = useQuery(api.users.getProfile);
  const stats = useQuery(api.bookmarks.getUserStats);
  const blurProfile = usePrivacyStore((state) => state.blurProfile);
  const { openInNewTab, showFavicons, updateSettings } = useGeneralStore();
  const [openSection, setOpenSection] = useState<SettingsSection>(null);

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push("/auth");
    } catch (error) {
      toast.error("Failed to sign out");
      console.error(error);
    }
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const imageUrl = user?.image ?? undefined;

  const settingsItems = [
    {
      id: "profile" as const,
      label: "Profile",
      icon: User,
      description: "Manage your personal information",
    },
    {
      id: "appearance" as const,
      label: "Appearance",
      icon: Palette,
      description: "Customize theme and display",
    },
    {
      id: "general" as const,
      label: "General",
      icon: SettingsIcon,
      description: "Application preferences",
    },
    {
      id: "notifications" as const,
      label: "Notifications",
      icon: Bell,
      description: "Notification settings",
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Compact Header */}
      <div className="px-4 pt-6 pb-4 border-b border-border bg-background">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className={cn("size-12 ring-2 ring-border", blurProfile && "blur-sm")}>
            <AvatarImage src={imageUrl} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className={cn("text-base font-semibold truncate", blurProfile && "blur-sm")}>
              {user?.name || "User"}
            </h2>
            {user?.email && (
              <p className={cn("text-xs text-muted-foreground truncate", blurProfile && "blur-sm")}>
                {user.email}
              </p>
            )}
          </div>
        </div>

        {/* Stats - Horizontal Cards */}
        {stats && (
          <div className="flex gap-2">
            <Card className="flex-1 border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-1.5 rounded-md">
                    <Bookmark className="size-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold tabular-nums">{stats.bookmarks}</p>
                    <p className="text-[10px] text-muted-foreground">Bookmarks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1 border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-1.5 rounded-md">
                    <FolderOpen className="size-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold tabular-nums">{stats.folders}</p>
                    <p className="text-[10px] text-muted-foreground">Folders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-foreground mb-0.5">Theme</p>
            <p className="text-[10px] text-muted-foreground">
              {theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System"}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={theme === "light" ? "default" : "ghost"}
              size="icon-xs"
              onClick={() => setTheme("light")}
              className="h-7 w-7"
            >
              <Sun className="size-3.5" />
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "ghost"}
              size="icon-xs"
              onClick={() => setTheme("dark")}
              className="h-7 w-7"
            >
              <Moon className="size-3.5" />
            </Button>
            <Button
              variant={theme === "system" ? "default" : "ghost"}
              size="icon-xs"
              onClick={() => setTheme("system")}
              className="h-7 w-7"
            >
              <Monitor className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Settings List */}
      <div className="flex-1 overflow-y-auto pb-20" style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}>
        <div className="px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Settings
          </p>
        </div>

        <div className="px-2">
          {settingsItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setOpenSection(item.id)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 active:bg-muted transition-colors text-left"
              >
                <div className="bg-muted p-2 rounded-lg">
                  <Icon className="size-4 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>

        <Separator className="my-2" />

        {/* Sign Out */}
        <div className="px-4 py-2">
          <Button
            variant="destructive"
            className="w-full h-10"
            onClick={handleSignOut}
          >
            <LogOut className="size-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Settings Dialogs */}
      <Dialog open={openSection === "profile"} onOpenChange={(open) => !open && setOpenSection(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Profile settings</DialogTitle>
          <div className="mt-4">
            <ProfileSettings />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openSection === "appearance"} onOpenChange={(open) => !open && setOpenSection(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Appearance settings</DialogTitle>
          <div className="mt-4">
            <AppearanceSettings />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openSection === "general"} onOpenChange={(open) => !open && setOpenSection(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogTitle className="sr-only">General settings</DialogTitle>
          <div className="mt-4">
            <GeneralSettings />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openSection === "notifications"} onOpenChange={(open) => !open && setOpenSection(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Notifications settings</DialogTitle>
          <div className="mt-4">
            <NotificationsSettings />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
