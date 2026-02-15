"use client";

import { MoreHorizontalIcon, TrashIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { FolderIconDisplay } from "@/components/bookmarks/folder-icon";
import type { Folder } from "@/components/bookmarks/types";
import { FOLDER_ID_ALL } from "@/lib/bookmarks-utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Editable,
  EditableArea,
  EditableInput,
  EditablePreview,
} from "@/components/ui/editable";

const AddFolderDialog = dynamic(
  () =>
    import("./add-folder-dialog").then((mod) => ({
      default: mod.AddFolderDialog,
    })),
  { ssr: false },
);

interface FoldersListViewProps {
  folders: Folder[];
  onSelectFolder: (folderId: string) => void;
  onAddFolder?: (name: string) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onDeleteFolder?: (folderId: string) => void;
}

export function FoldersListView({
  folders,
  onSelectFolder,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
}: FoldersListViewProps) {
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
          {folders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onSelectFolder={onSelectFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FolderCard({
  folder,
  onSelectFolder,
  onRenameFolder,
  onDeleteFolder,
}: {
  folder: Folder;
  onSelectFolder: (folderId: string) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onDeleteFolder?: (folderId: string) => void;
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const isEditableFolder = folder.id !== FOLDER_ID_ALL;

  return (
    <>
      <Card
        className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98] relative"
        onClick={() => onSelectFolder(folder.id)}
      >
        {isEditableFolder && onDeleteFolder && (
          <div
            className="absolute right-1 top-1 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded p-1.5 opacity-70 hover:opacity-100 hover:bg-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  aria-label="Folder actions"
                >
                  <MoreHorizontalIcon className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteDialogOpen(true);
                  }}
                >
                  <TrashIcon className="size-4" />
                  Delete folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        <CardContent className="p-4 flex flex-col items-center gap-3 pt-8">
          <div className="text-muted-foreground">
            <FolderIconDisplay folder={folder} size="md" />
          </div>
          <div className="text-center w-full min-w-0">
            {isEditableFolder && onRenameFolder ? (
              <Editable
                defaultValue={folder.name}
                triggerMode="dblclick"
                onSubmit={(value) => {
                  const trimmed = value.trim();
                  if (trimmed) onRenameFolder(folder.id, trimmed);
                }}
                className="w-full"
              >
                <EditableArea>
                  <EditablePreview className="truncate text-sm font-medium block w-full" />
                  <EditableInput className="truncate text-sm font-medium text-center" />
                </EditableArea>
              </Editable>
            ) : (
              <p className="text-sm font-medium truncate w-full">
                {folder.name}
              </p>
            )}
            <Badge variant="secondary" className="mt-1 text-xs">
              {folder.count}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder</AlertDialogTitle>
            <AlertDialogDescription>
              Delete folder &quot;{folder.name}&quot;? All {folder.count}{" "}
              bookmark{folder.count === 1 ? "" : "s"} in this folder will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                onDeleteFolder?.(folder.id);
                setDeleteDialogOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
