"use client";

import { BookmarkIcon, FolderIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useDndContext, useDroppable } from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import type { Folder } from "@/components/bookmarks/types";
import type { DragData } from "@/components/bookmarks/types";

const AddFolderDialog = dynamic(
  () => import("@/components/bookmarks/add-folder-dialog").then((mod) => ({ default: mod.AddFolderDialog })),
  { ssr: false }
);
import { UserProfile } from "@/components/bookmarks/user-profile";
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { cn } from "@/lib/utils";

interface FoldersSidebarProps {
  folders: Folder[];
  selectedFolder: string;
  onSelectFolder: (folderId: string) => void;
  onAddFolder?: (name: string) => void;
  onSettings?: () => void;
  /** Optional class for the root container (e.g. for use in a sheet on mobile). */
  className?: string;
}

interface DroppableFolderItemProps {
  folder: Folder;
  selectedFolder: string;
  onSelectFolder: (folderId: string) => void;
  getFolderIcon: (folder: Folder) => ReactNode;
}

function DroppableFolderItem({
  folder,
  selectedFolder,
  onSelectFolder,
  getFolderIcon,
}: DroppableFolderItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { active } = useDndContext();
  const activeData = active?.data.current as DragData | null;
  const isDraggingBookmark = activeData?.type === "bookmark";
  const droppable = folder.id !== "all";
  const { setNodeRef, isOver } = useDroppable({
    id: folder.id,
    disabled: !droppable,
    data: {
      type: "folder",
      folderId: folder.id,
    },
  });

  return (
    <Item
      key={folder.id}
      size="xs"
      asChild
      ref={droppable ? setNodeRef : undefined}
      className={cn(
        "cursor-pointer rounded-md px-2 transition-all",
        selectedFolder === folder.id && "bg-accent",
        droppable &&
        isDraggingBookmark &&
        "border border-dashed border-border/60 bg-accent/40",
        droppable &&
        isOver &&
        "bg-accent/80 ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        onClick={() => onSelectFolder(folder.id)}
        className="relative w-full"
        aria-current={selectedFolder === folder.id ? "true" : undefined}
      >
        <AnimatePresence>
          {isHovered && (
            <motion.div
              layoutId="folders-sidebar-hover-bg"
              className="absolute inset-0 rounded-md bg-accent/50 pointer-events-none"
              style={{ zIndex: 0 }}
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
        <ItemMedia className="relative z-10 text-muted-foreground">
          {getFolderIcon(folder)}
        </ItemMedia>
        <ItemContent className="relative z-10 min-w-0">
          <ItemTitle className="truncate text-sm font-normal">
            {folder.name}
          </ItemTitle>
        </ItemContent>
        <ItemActions className="relative z-10">
          <Badge variant="secondary" className="text-xs tabular-nums">
            {folder.count}
          </Badge>
        </ItemActions>
      </button>
    </Item>
  );
}

export function FoldersSidebar({
  folders,
  selectedFolder,
  onSelectFolder,
  onAddFolder,
  onSettings,
  className,
}: FoldersSidebarProps) {
  // Get icon for folder
  const getFolderIcon = (folder: Folder) => {
    if (folder.id === "all") return <BookmarkIcon className="size-4" />;
    if (folder.icon) {
      const Icon = folder.icon;
      return <Icon className="size-4" />;
    }
    return <FolderIcon className="size-4" />;
  };

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex items-center justify-between p-4">
        <h2 id="folders-sidebar-label" className="text-sm font-medium">
          Folders
        </h2>
        <AddFolderDialog onSubmit={onAddFolder} />
      </div>
      <nav
        className="flex-1 overflow-y-auto px-2 min-h-0"
        aria-label="Folders"
        aria-labelledby="folders-sidebar-label"
      >
        <ItemGroup className="gap-0.5">
          {folders.map((folder) => (
            <DroppableFolderItem
              key={folder.id}
              folder={folder}
              selectedFolder={selectedFolder}
              onSelectFolder={onSelectFolder}
              getFolderIcon={getFolderIcon}
            />
          ))}
        </ItemGroup>
      </nav>

      {/* User Profile Section */}
      <UserProfile onSettings={onSettings} />
    </div>
  );
}
