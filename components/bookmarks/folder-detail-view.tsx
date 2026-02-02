"use client";

import { ArrowLeft, FolderIcon, SearchIcon, BookmarkIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookmarkCard } from "./bookmark-card";
import { FlipReveal, FlipRevealItem } from "@/components/gsap/flip-reveal";
import type { Bookmark, Folder } from "./types";
import dynamic from "next/dynamic";

const AddBookmarkDialog = dynamic(
  () => import("./add-bookmark-dialog").then((mod) => ({ default: mod.AddBookmarkDialog })),
  { ssr: false }
);

interface FolderDetailViewProps {
  folder: Folder;
  bookmarks: Bookmark[];
  editableFolders: Folder[];
  onBack: () => void;
  onEditBookmark: (bookmark: Bookmark) => void;
  onDeleteBookmark: (bookmark: Bookmark) => void;
  onAddBookmark: (data: {
    url: string;
    title: string;
    favicon: string | null;
    ogImage: string | null;
    folderId: string;
  }) => Promise<void>;
}

export function FolderDetailView({
  folder,
  bookmarks,
  editableFolders,
  onBack,
  onEditBookmark,
  onDeleteBookmark,
  onAddBookmark,
}: FolderDetailViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBookmarks = useMemo(() => {
    let result = bookmarks;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.url.toLowerCase().includes(query)
      );
    }

    return result;
  }, [bookmarks, searchQuery]);

  const getFolderIcon = () => {
    if (folder.icon) {
      const Icon = folder.icon;
      return <Icon className="size-4" />;
    }
    return <FolderIcon className="size-4" />;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          className="shrink-0"
        >
          <ArrowLeft className="size-4" />
        </Button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="text-muted-foreground shrink-0">
            {getFolderIcon()}
          </div>
          <h1 className="text-sm font-medium truncate">{folder.name}</h1>
        </div>

        <div className="relative max-w-xs flex-1 hidden sm:block">
          <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-9 text-sm"
          />
        </div>

        <AddBookmarkDialog
          folders={editableFolders}
          onSubmit={onAddBookmark}
        />
      </header>

      {/* Search bar for mobile */}
      <div className="px-4 py-2 border-b border-border sm:hidden">
        <div className="relative">
          <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>
      </div>

      {/* Bookmarks Grid */}
      <div className="flex-1 overflow-y-auto p-4 pb-20" style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}>
        {bookmarks.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="bg-muted flex size-12 items-center justify-center rounded-lg">
              <BookmarkIcon className="text-muted-foreground size-6" />
            </div>
            <div>
              <p className="text-sm font-medium">No bookmarks in this folder</p>
              <p className="text-muted-foreground text-sm">
                Add your first bookmark to get started
              </p>
            </div>
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="bg-muted flex size-12 items-center justify-center rounded-lg">
              <BookmarkIcon className="text-muted-foreground size-6" />
            </div>
            <div>
              <p className="text-sm font-medium">No bookmarks found</p>
              <p className="text-muted-foreground text-sm">
                Try a different search term
              </p>
            </div>
          </div>
        ) : (
          <div className="relative h-full">
            <FlipReveal
              keys={filteredBookmarks.map((b) => String(b.id))}
              showClass="block"
              hideClass="hidden"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredBookmarks.map((bookmark, index) => (
                  <FlipRevealItem key={bookmark.id} flipKey={String(bookmark.id)}>
                    <BookmarkCard
                      bookmark={bookmark}
                      onEdit={onEditBookmark}
                      onDelete={onDeleteBookmark}
                      priority={index === 0}
                    />
                  </FlipRevealItem>
                ))}
              </div>
            </FlipReveal>
          </div>
        )}
      </div>
    </div>
  );
}
