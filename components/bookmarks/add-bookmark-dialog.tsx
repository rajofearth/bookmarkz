"use client";

import { Loader2Icon, PlusIcon } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { useUrlMetadata } from "@/hooks/use-url-metadata";
import type { Folder } from "./types";

interface AddBookmarkDialogProps {
  folders: Folder[];
  onSubmit?: (data: {
    url: string;
    title: string;
    favicon: string | null;
    ogImage: string | null;
    folderId: string;
  }) => void;
}

export function AddBookmarkDialog({
  folders,
  onSubmit,
}: AddBookmarkDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [folderId, setFolderId] = useState("");

  const { metadata, isLoading, fetchMetadata, reset } = useUrlMetadata();

  // Auto-populate title when metadata is fetched
  useEffect(() => {
    if (metadata?.title && !title) {
      setTitle(metadata.title);
    }
  }, [metadata, title]);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    fetchMetadata(newUrl);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit?.({
        url: url.trim(),
        title: title.trim() || url.trim(),
        favicon: metadata?.favicon ?? null,
        ogImage: metadata?.ogImage ?? null,
        folderId,
      });
      handleReset();
      setOpen(false);
    }
  };

  const handleReset = () => {
    setUrl("");
    setTitle("");
    setFolderId("");
    reset();
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      handleReset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <PlusIcon className="size-4" />
          <span className="hidden sm:inline">Add Bookmark</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Bookmark</DialogTitle>
          <DialogDescription>
            Save a link to your bookmarks collection.
          </DialogDescription>
        </DialogHeader>
        <form id="add-bookmark-form" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="bookmark-url">URL</FieldLabel>
              <div className="relative">
                <Input
                  id="bookmark-url"
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
              <FieldLabel htmlFor="bookmark-title">
                Title
                {metadata?.favicon && (
                  <Image
                    src={metadata.favicon}
                    alt=""
                    width={16}
                    height={16}
                    className="ml-2 inline-block size-4"
                  />
                )}
              </FieldLabel>
              <Input
                id="bookmark-title"
                type="text"
                placeholder="My Bookmark"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="bookmark-folder">Folder</FieldLabel>
              <NativeSelect
                id="bookmark-folder"
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
          <Button type="submit" form="add-bookmark-form" disabled={isLoading}>
            Save Bookmark
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
