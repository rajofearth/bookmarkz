"use client";

import { Loader2Icon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

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
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { useUrlMetadata } from "@/hooks/use-url-metadata";
import { FOLDER_ID_ALL, fromConvexFolderId } from "@/lib/bookmarks-utils";
import type { Bookmark, Folder } from "./types";

interface EditBookmarkDialogProps {
  bookmark: Bookmark | null;
  folders: Folder[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (
    bookmarkId: string,
    data: {
      url: string;
      title: string;
      favicon: string | null;
      ogImage: string | null;
      folderId: string;
    },
  ) => void;
}

export function EditBookmarkDialog({
  bookmark,
  folders,
  open,
  onOpenChange,
  onSubmit,
}: EditBookmarkDialogProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [folderId, setFolderId] = useState("");

  const { metadata, isLoading, fetchMetadata, reset } = useUrlMetadata();

  // Pre-fill form when bookmark changes
  useEffect(() => {
    if (bookmark) {
      setUrl(bookmark.url);
      setTitle(bookmark.title);
      const uiFolderId = fromConvexFolderId(bookmark.folderId);
      setFolderId(uiFolderId === FOLDER_ID_ALL ? "" : uiFolderId);
    } else {
      setUrl("");
      setTitle("");
      setFolderId("");
      reset();
    }
  }, [bookmark, reset]);

  // Auto-update title when metadata is fetched (only if URL changed)
  useEffect(() => {
    if (metadata?.title && url !== bookmark?.url) {
      setTitle(metadata.title);
    }
  }, [metadata, bookmark, url]);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    fetchMetadata(newUrl);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && bookmark) {
      // Check if URL has changed
      const urlChanged = url.trim() !== bookmark.url;

      // If URL changed, prefer new metadata; if URL unchanged, keep existing metadata
      const newFavicon = urlChanged
        ? (metadata?.favicon ?? null)
        : (metadata?.favicon ?? bookmark.favicon ?? null);
      const newOgImage = urlChanged
        ? (metadata?.ogImage ?? null)
        : (metadata?.ogImage ?? bookmark.ogImage ?? null);

      onSubmit?.(bookmark.id, {
        url: url.trim(),
        title: title.trim() || url.trim(),
        favicon: newFavicon,
        ogImage: newOgImage,
        folderId,
      });
      onOpenChange(false);
    }
  };

  const handleReset = () => {
    setUrl("");
    setTitle("");
    setFolderId("");
    reset();
  };

  const handleOpenChangeInternal = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      handleReset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChangeInternal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Bookmark</DialogTitle>
          <DialogDescription>Update your bookmark details.</DialogDescription>
        </DialogHeader>
        <form id="edit-bookmark-form" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="edit-bookmark-url">URL</FieldLabel>
              <div className="relative">
                <Input
                  id="edit-bookmark-url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  required
                />
                {isLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
                  </div>
                )}
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-bookmark-title">
                Title
                {(metadata?.favicon || bookmark?.favicon) && (
                  <Image
                    src={metadata?.favicon ?? bookmark?.favicon ?? ""}
                    alt=""
                    width={16}
                    height={16}
                    className="ml-2 inline-block size-4"
                  />
                )}
              </FieldLabel>
              <Input
                id="edit-bookmark-title"
                type="text"
                placeholder="My Bookmark"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-bookmark-folder">Folder</FieldLabel>
              <NativeSelect
                id="edit-bookmark-folder"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
              >
                <NativeSelectOption value="">
                  Select a folder
                </NativeSelectOption>
                {folders.map((folder) => (
                  <NativeSelectOption key={folder.id} value={folder.id}>
                    {folder.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" form="edit-bookmark-form" disabled={isLoading}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
