"use client";

import { Monitor, Moon, Settings, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useGeneralStore } from "@/hooks/use-general-store";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./section-header";
import { ThemeCard } from "./theme-card";

export function PreferencesSettings() {
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();
  const { openInNewTab, showFavicons, reducedMotion, updateSettings } =
    useGeneralStore();

  const rowClass =
    "flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0";
  const labelWrapClass = "space-y-0.5 min-w-0";

  return (
    <>
      <SectionHeader
        title="Preferences"
        description="Customize how the app looks and behaves."
        compact={isMobile}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn("max-w-2xl", isMobile && "space-y-1")}
      >
        <div className={cn(isMobile ? "space-y-3" : "space-y-4")}>
          <div className="flex items-center gap-2">
            <Settings className="size-4 text-muted-foreground shrink-0" />
            <Label className="text-base">Theme</Label>
          </div>
          <div
            className={cn(
              "grid grid-cols-3 max-w-lg",
              isMobile ? "gap-2" : "gap-4",
            )}
          >
            <ThemeCard
              theme="light"
              active={theme === "light"}
              onClick={() => setTheme("light")}
              icon={Sun}
              label="Light"
            />
            <ThemeCard
              theme="dark"
              active={theme === "dark"}
              onClick={() => setTheme("dark")}
              icon={Moon}
              label="Dark"
            />
            <ThemeCard
              theme="system"
              active={theme === "system"}
              onClick={() => setTheme("system")}
              icon={Monitor}
              label="System"
            />
          </div>
        </div>

        <Separator className={isMobile ? "my-4" : "my-6"} />

        <div className={cn(isMobile ? "space-y-0" : "space-y-6")}>
          <div className={rowClass}>
            <div className={labelWrapClass}>
              <Label className="text-base">Reduced Motion</Label>
              <p className="text-sm text-muted-foreground">
                Reduce interface animations throughout the app.
              </p>
            </div>
            <Switch
              checked={reducedMotion}
              onCheckedChange={(checked) =>
                updateSettings({ reducedMotion: checked })
              }
            />
          </div>
          <Separator className={isMobile ? "my-2" : "my-4"} />
          <div className={rowClass}>
            <div className={labelWrapClass}>
              <Label className="text-base">Open links in new tab</Label>
              <p className="text-sm text-muted-foreground">
                Always open bookmarks in a new browser tab.
              </p>
            </div>
            <Switch
              checked={openInNewTab}
              onCheckedChange={(checked) =>
                updateSettings({ openInNewTab: checked })
              }
            />
          </div>
          <Separator className={isMobile ? "my-2" : "my-4"} />
          <div className={rowClass}>
            <div className={labelWrapClass}>
              <Label className="text-base">Show favicons</Label>
              <p className="text-sm text-muted-foreground">
                Display website icons next to bookmark titles.
              </p>
            </div>
            <Switch
              checked={showFavicons}
              onCheckedChange={(checked) =>
                updateSettings({ showFavicons: checked })
              }
            />
          </div>
        </div>
      </motion.div>
    </>
  );
}
