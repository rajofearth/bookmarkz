import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeCardProps {
  theme: string;
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}

export function ThemeCard({
  theme,
  active,
  onClick,
  icon: Icon,
  label,
}: ThemeCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-lg border-2 p-4 flex flex-col items-center gap-2 hover:bg-muted/50 transition-all",
        active ? "border-primary bg-muted/50" : "border-muted",
      )}
    >
      <div
        className={cn(
          "rounded-full p-2",
          active ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        <Icon className="size-5" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
