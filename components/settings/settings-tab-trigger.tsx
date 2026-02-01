import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

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
    onClick
}: SettingsTabTriggerProps) {
    return (
        <Button
            variant="ghost"
            onClick={onClick}
            className={cn(
                "w-full justify-start gap-3 px-3 py-2 h-9 rounded-md transition-all font-medium",
                active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 dark:text-sidebar-foreground/60 hover:bg-sidebar-accent/50"
            )}
        >
            <Icon className="size-4" />
            {label}
        </Button>
    );
}
