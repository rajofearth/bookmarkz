"use client";

import { GlobeIcon, Loader2Icon } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FOLDER_ID_ALL, fromConvexFolderId } from "@/lib/bookmarks-utils";
import { getDomain } from "@/lib/utils";
import type { Bookmark, Folder } from "./types";

interface MoveBookmarkDialogProps {
  bookmark: Bookmark | null;
  folders: Folder[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMove?: (bookmarkId: string, folderId: string) => Promise<void> | void;
}

export function MoveBookmarkDialog({
  bookmark,
  folders,
  open,
  onOpenChange,
  onMove,
}: MoveBookmarkDialogProps) {
  const [folderId, setFolderId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (bookmark) {
      const uiFolderId = fromConvexFolderId(bookmark.folderId);
      setFolderId(uiFolderId === FOLDER_ID_ALL ? "" : uiFolderId);
    } else {
      setFolderId("");
    }
  }, [bookmark]);

  const currentFolderName = useMemo(() => {
    if (!bookmark) return null;

    if (!bookmark.folderId || bookmark.folderId === FOLDER_ID_ALL) {
      return "All Bookmarks";
    }

    const match = folders.find((folder) => folder.id === bookmark.folderId);
    return match?.name ?? "Unknown folder";
  }, [bookmark, folders]);

  const selectedFolderName = useMemo(() => {
    if (!folderId) return "";
    const match = folders.find((folder) => String(folder.id) === folderId);
    return match?.name ?? "";
  }, [folders, folderId]);

  const isSameFolder =
    !!bookmark && !!folderId && folderId === bookmark.folderId;

  const handleReset = () => {
    setFolderId("");
    setIsSubmitting(false);
  };

  const handleOpenChangeInternal = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      handleReset();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookmark || !folderId || !onMove || isSameFolder) return;

    try {
      setIsSubmitting(true);
      await onMove(bookmark.id, folderId);
      handleOpenChangeInternal(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to move bookmark:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChangeInternal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move bookmark</DialogTitle>
          <DialogDescription>
            Choose where you want this bookmark to live.
          </DialogDescription>
        </DialogHeader>

        {bookmark && (
          <div className="border-border bg-muted/40 mb-4 flex flex-col gap-2 rounded-lg border px-3 py-2 text-xs sm:flex-row sm:items-center sm:gap-4 sm:text-sm">
            <div className="bg-background flex size-8 items-center justify-center rounded-full shadow-sm">
              {bookmark.favicon?.startsWith("http") ? (
                <Image
                  src={bookmark.favicon}
                  alt=""
                  width={16}
                  height={16}
                  className="size-4 object-contain"
                />
              ) : (
                <GlobeIcon className="text-muted-foreground size-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[0.8rem] font-medium sm:text-sm">
                {bookmark.title}
              </p>
              <p className="text-muted-foreground truncate text-[11px] sm:text-xs">
                {getDomain(bookmark.url)}
              </p>
            </div>
            {currentFolderName && (
              <span className="bg-primary/10 text-primary/90 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium sm:ml-auto sm:self-start">
                In {currentFolderName}
              </span>
            )}
          </div>
        )}

        <form id="move-bookmark-form" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="move-bookmark-folder">Folder</FieldLabel>
              <Select
                value={folderId}
                onValueChange={setFolderId}
                disabled={isSubmitting || !bookmark}
              >
                <SelectTrigger id="move-bookmark-folder" className="w-full">
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={String(folder.id)}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isSameFolder && (
                <p className="text-muted-foreground mt-1 text-xs">
                  This bookmark is already in this folder.
                </p>
              )}
            </Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <DialogClose asChild disabled={isSubmitting}>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            type="submit"
            form="move-bookmark-form"
            disabled={isSubmitting || !folderId || !bookmark || isSameFolder}
          >
            {isSubmitting && (
              <Loader2Icon className="mr-2 size-4 animate-spin" />
            )}
            {selectedFolderName ? `Move to ${selectedFolderName}` : "Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
