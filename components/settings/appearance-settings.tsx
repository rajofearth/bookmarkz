import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { SectionHeader } from "./section-header";
import { ThemeCard } from "./theme-card";

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <SectionHeader
        title="Appearance"
        description="Customize the look and feel of the application."
      />

      <div className="space-y-4">
        <Label className="text-base">Theme</Label>
        <div className="grid grid-cols-3 gap-4 max-w-lg">
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

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between max-w-2xl">
          <div className="space-y-0.5">
            <Label className="text-base">Reduced Motion</Label>
            <p className="text-sm text-muted-foreground">
              Reduce the amount of animations in the interface.
            </p>
          </div>
          <Switch />
        </div>
      </div>
    </>
  );
}
