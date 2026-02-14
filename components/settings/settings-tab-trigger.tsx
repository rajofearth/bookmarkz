import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SettingsTabTriggerProps {
  value: string;
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function SettingsTabTrigger({
  value,
  icon: Icon,
  label,
  active,
  onClick,
}: SettingsTabTriggerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const showPill = isHovered || active;

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative w-full justify-start gap-3 px-3 py-2 h-9 rounded-md transition-all font-medium",
        active
          ? "text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 dark:text-sidebar-foreground/60",
      )}
    >
      <AnimatePresence>
        {showPill && (
          <motion.div
            layoutId="settings-sidebar-pill"
            className={cn(
              "absolute inset-0 z-0 rounded-md pointer-events-none",
              active ? "bg-sidebar-accent" : "bg-sidebar-accent/50",
            )}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              layout: { type: "spring", stiffness: 400, damping: 30 },
              opacity: { duration: 0.15 },
              scale: { duration: 0.15 },
            }}
          />
        )}
      </AnimatePresence>
      <Icon className="size-4 relative z-10" />
      <span className="relative z-10">{label}</span>
    </Button>
  );
}
