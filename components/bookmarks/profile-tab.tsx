"use client";

import { useQuery } from "convex/react";
import {
  ArrowLeft,
  Bookmark,
  ChevronRight,
  Database,
  FolderOpen,
  LogOut,
  SlidersHorizontal,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DataSettings } from "@/components/settings/data-settings";
import { PreferencesSettings } from "@/components/settings/preferences-settings";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { usePrivacyStore } from "@/hooks/use-privacy-store";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type ProfileScreen = "root" | "profile" | "preferences" | "data";

export function ProfileTab() {
  const router = useRouter();
  const user = useQuery(api.users.getProfile);
  const stats = useQuery(api.bookmarks.getUserStats);
  const blurProfile = usePrivacyStore((state) => state.blurProfile);
  const [screen, setScreen] = useState<ProfileScreen>("root");

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
      id: "profile" as ProfileScreen,
      label: "Profile",
      icon: User,
      description: "Manage your personal information",
    },
    {
      id: "preferences" as ProfileScreen,
      label: "Preferences",
      icon: SlidersHorizontal,
      description: "Theme and app behavior",
    },
    {
      id: "data" as ProfileScreen,
      label: "Data",
      icon: Database,
      description: "Import and export bookmarks",
    },
  ];

  const titles: Record<Exclude<ProfileScreen, "root">, string> = {
    profile: "Profile",
    preferences: "Preferences",
    data: "Data",
  };

  const renderDetailScreen = () => {
    if (screen === "profile") return <ProfileSettings />;
    if (screen === "preferences") return <PreferencesSettings />;
    return <DataSettings />;
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-background">
      <AnimatePresence mode="wait" initial={false}>
        {screen === "root" ? (
          <motion.div
            key="profile-root"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="px-4 pt-5 pb-4 border-b border-border bg-background">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className={cn("size-14", blurProfile && "blur-sm")}>
                  <AvatarImage src={imageUrl} />
                  <AvatarFallback className="font-semibold text-base">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h2
                    className={cn(
                      "text-base font-semibold truncate",
                      blurProfile && "blur-sm",
                    )}
                  >
                    {user?.name || "User"}
                  </h2>
                  {user?.email && (
                    <p
                      className={cn(
                        "text-xs text-muted-foreground truncate",
                        blurProfile && "blur-sm",
                      )}
                    >
                      {user.email}
                    </p>
                  )}
                </div>
              </div>

              {stats && (
                <div className="flex gap-2">
                  <Card className="flex-1">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Bookmark className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-lg font-semibold tabular-nums">
                            {stats.bookmarks}
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            Bookmarks
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="flex-1">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-lg font-semibold tabular-nums">
                            {stats.folders}
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            Folders
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom))]">
              <div className="px-4 py-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Settings
                </p>
              </div>

              <div className="px-3">
                {settingsItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setScreen(item.id)}
                      className="w-full flex items-center gap-3 px-2 py-3.5 border-b border-border/70 text-left"
                    >
                      <Icon className="size-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {item.description}
                        </p>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>

              <div className="px-4 mt-6 pt-4">
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
          </motion.div>
        ) : (
          <motion.div
            key={`profile-${screen}`}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="px-3 py-2 border-b border-border bg-background">
              <button
                type="button"
                onClick={() => setScreen("root")}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground"
              >
                <ArrowLeft className="size-4" />
                Back
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
              {renderDetailScreen()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
