"use client";

import { BookmarkIcon, FolderIcon, StarIcon } from "lucide-react";
import dynamic from "next/dynamic";
import type { Folder } from "@/components/bookmarks/types";

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
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-sm font-medium">Folders</h2>
        <AddFolderDialog onSubmit={onAddFolder} />
      </div>
      <nav className="flex-1 overflow-y-auto px-2">
        <ItemGroup className="gap-0.5">
          {folders.map((folder) => (
            <Item
              key={folder.id}
              size="xs"
              asChild
              className={cn(
                "cursor-pointer rounded-md px-2",
                selectedFolder === folder.id && "bg-accent",
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
          ))}
        </ItemGroup>
      </nav>

      {/* User Profile Section */}
      <UserProfile onSettings={onSettings} />
    </div>
  );
}
