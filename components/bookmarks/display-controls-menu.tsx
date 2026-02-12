"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  Grid2x2,
  LayoutGrid,
  List,
  Table,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type SortMode,
  useGeneralStore,
  type ViewMode,
} from "@/hooks/use-general-store";

const VIEW_MODE_OPTIONS: {
  value: ViewMode;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "normal", label: "Normal view", icon: LayoutGrid },
  { value: "compact", label: "Compact view", icon: Grid2x2 },
  { value: "list", label: "List", icon: List },
  { value: "details", label: "Details", icon: Table },
];

export function DisplayControlsMenu() {
  const { viewMode, sortMode, updateSettings } = useGeneralStore();
  const ActiveIcon =
    VIEW_MODE_OPTIONS.find((option) => option.value === viewMode)?.icon ??
    LayoutGrid;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          aria-label="Display and sort controls"
        >
          <ActiveIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[190px]">
        <DropdownMenuLabel>View</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={viewMode}
          onValueChange={(value) =>
            updateSettings({ viewMode: value as ViewMode })
          }
        >
          {VIEW_MODE_OPTIONS.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={value} value={value} className="gap-2">
              <Icon className="size-4 shrink-0" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Sort</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={sortMode}
          onValueChange={(value) =>
            updateSettings({ sortMode: value as SortMode })
          }
        >
          <DropdownMenuRadioItem value="newest" className="gap-2">
            <ArrowDownIcon className="size-4 shrink-0" />
            Newest first
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="oldest" className="gap-2">
            <ArrowUpIcon className="size-4 shrink-0" />
            Oldest first
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
