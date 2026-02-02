"use client";

import { BookmarkIcon, FolderIcon, StarIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useDndContext, useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import type { Folder } from "@/components/bookmarks/types";
import type { DragData } from "./bookmarks-page";

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
  const { active } = useDndContext();
  const activeData = active?.data.current as DragData | null;
  const isDraggingBookmark = activeData?.type === "bookmark";
  const droppable = folder.id !== "all" && folder.id !== "favorites";
  const { setNodeRef, isOver } = useDroppable<DragData>({
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
    >
      <button
        type="button"
        onClick={() => onSelectFolder(folder.id)}
        className="w-full"
      >
        <ItemMedia className="text-muted-foreground">
          {getFolderIcon(folder)}
        </ItemMedia>
        <ItemContent className="min-w-0">
          <ItemTitle className="truncate text-sm font-normal">
            {folder.name}
          </ItemTitle>
        </ItemContent>
        <ItemActions>
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
}: FoldersSidebarProps) {
  // Get icon for folder
  const getFolderIcon = (folder: Folder) => {
    if (folder.id === "all") return <BookmarkIcon className="size-4" />;
    if (folder.id === "favorites") return <StarIcon className="size-4" />;
    if (folder.icon) {
      const Icon = folder.icon;
      return <Icon className="size-4" />;
    }
    return <FolderIcon className="size-4" />;
  };

  return (
    <div className="hidden md:flex h-full flex-col">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-sm font-medium">Folders</h2>
        <AddFolderDialog onSubmit={onAddFolder} />
      </div>
      <nav className="flex-1 overflow-y-auto px-2">
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
