"use client";

import { BookmarkIcon, FolderIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Folder } from "./types";

interface FolderIconDisplayProps {
  folder: Folder;
  className?: string;
  /** Default size is size-4 for sidebar/detail; use size-5 for grid cards */
  size?: "sm" | "md";
}

export function FolderIconDisplay({
  folder,
  className,
  size = "sm",
}: FolderIconDisplayProps) {
  const sizeClass = size === "md" ? "size-5" : "size-4";
  const iconClass = cn(sizeClass, className);

  if (folder.id === "all") {
    return <BookmarkIcon className={iconClass} />;
  }
  if (folder.icon) {
    const Icon = folder.icon;
    return <Icon className={iconClass} />;
  }
  return <FolderIcon className={iconClass} />;
}
