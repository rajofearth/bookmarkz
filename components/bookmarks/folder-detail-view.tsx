"use client";

import { ArrowLeft, BookmarkIcon, SearchIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { FlipReveal } from "@/components/gsap/flip-reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGeneralStore } from "@/hooks/use-general-store";
import {
  filterBookmarksBySearch,
  getViewModeGridClasses,
  sortBookmarksByDate,
} from "@/lib/bookmarks-utils";
import { BookmarkCard } from "./bookmark-card";
import { DetailsHeaderRow } from "./bookmarks-empty-details";
import { DisplayControlsMenu } from "./display-controls-menu";
import { FolderIconDisplay } from "./folder-icon";
import type { Bookmark, Folder } from "./types";

const AddBookmarkDialog = dynamic(
  () =>
    import("./add-bookmark-dialog").then((mod) => ({
      default: mod.AddBookmarkDialog,
    })),
  { ssr: false },
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
    description: string | null;
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
  const { viewMode, sortMode } = useGeneralStore();

  const filteredBookmarks = useMemo(
    () =>
      sortBookmarksByDate(
        filterBookmarksBySearch(bookmarks, searchQuery),
        sortMode,
      ),
    [bookmarks, searchQuery, sortMode],
  );

  return (
    <div className="flex flex-col h-full min-h-0">
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
            <FolderIconDisplay folder={folder} />
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

        <DisplayControlsMenu />

        <AddBookmarkDialog folders={editableFolders} onSubmit={onAddBookmark} />
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
      <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
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
        ) : (
          <div className="relative h-full">
            {filteredBookmarks.length === 0 && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 text-center">
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
            )}
            {/* Details header row */}
            {viewMode === "details" && <DetailsHeaderRow />}
            <FlipReveal
              keys={filteredBookmarks.map((b) => String(b.id))}
              showClass="block"
              hideClass="hidden"
            >
              <div className={getViewModeGridClasses(viewMode)}>
                <AnimatePresence initial={false} mode="popLayout">
                  {filteredBookmarks.map((bookmark) => (
                    <motion.div
                    key={bookmark.id}
                    data-flip={String(bookmark.id)}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <BookmarkCard
                      bookmark={bookmark}
                      folderName={folder.name}
                      viewMode={viewMode}
                      onEdit={onEditBookmark}
                      onDelete={onDeleteBookmark}
                      priority={filteredBookmarks[0]?.id === bookmark.id}
                    />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </FlipReveal>
          </div>
        )}
      </div>
    </div>
  );
}
