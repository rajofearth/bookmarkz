"use client";

import { BookmarkIcon, FolderIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Folder } from "./types";

const AddFolderDialog = dynamic(
  () => import("./add-folder-dialog").then((mod) => ({ default: mod.AddFolderDialog })),
  { ssr: false }
);

interface FoldersListViewProps {
  folders: Folder[];
  onSelectFolder: (folderId: string) => void;
  onAddFolder?: (name: string) => void;
}

export function FoldersListView({
  folders,
  onSelectFolder,
  onAddFolder,
}: FoldersListViewProps) {
  const getFolderIcon = (folder: Folder) => {
    if (folder.id === "all") return <BookmarkIcon className="size-5" />;
    if (folder.icon) {
      const Icon = folder.icon;
      return <Icon className="size-5" />;
    }
    return <FolderIcon className="size-5" />;
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h1 className="text-lg font-semibold">Folders</h1>
        <AddFolderDialog onSubmit={onAddFolder} />
      </div>

      {/* Folders Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {folders.map((folder) => {
            const Icon = getFolderIcon(folder);
            return (
              <Card
                key={folder.id}
                className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
                onClick={() => onSelectFolder(folder.id)}
              >
                <CardContent className="p-4 flex flex-col items-center gap-3">
                  <div className="text-muted-foreground">{Icon}</div>
                  <div className="text-center">
                    <p className="text-sm font-medium truncate w-full">{folder.name}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {folder.count}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
