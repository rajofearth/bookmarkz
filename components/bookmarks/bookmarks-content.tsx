"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookmarkIcon, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FlipReveal } from "@/components/gsap/flip-reveal";
import { ImportGuide } from "@/components/onboarding/import-guide";
import { useGeneralStore } from "@/hooks/use-general-store";
import { getViewModeGridClasses } from "@/lib/bookmarks-utils";
import { cn } from "@/lib/utils";
import { BookmarkCard } from "./bookmark-card";
import { DetailsHeaderRow } from "./bookmarks-empty-details";
import type { Bookmark, Folder } from "./types";

type SearchMode = "lexical" | "semantic";
type SemanticStage = "idle" | "embedding" | "vectorSearch" | "rerank" | "error";

function stageLabel(stage: SemanticStage) {
  if (stage === "embedding") return "Embedding...";
  if (stage === "vectorSearch") return "Searching...";
  if (stage === "rerank") return "Reranking...";
  return "Searching...";
}

interface BookmarksContentProps {
  isLoading: boolean;
  bookmarksCount: number;
  filteredBookmarks: Bookmark[];
  folderNameById: Record<string, string>;
  editableFolders: Folder[];
  searchQuery: string;
  searchMode: SearchMode;
  isSemanticLoading: boolean;
  semanticStage: SemanticStage;
  semanticLatencyMs: number | null;
  isIndexingIncomplete: boolean;
  onEditBookmark: (bookmark: Bookmark) => void;
  onDeleteBookmark: (bookmark: Bookmark) => void;
  onMoveBookmark: (
    bookmarkId: string,
    folderId: string,
  ) => Promise<void> | void;
}

export function BookmarksContent({
  isLoading,
  bookmarksCount,
  filteredBookmarks,
  folderNameById,
  editableFolders,
  searchQuery,
  searchMode,
  isSemanticLoading,
  semanticStage,
  semanticLatencyMs,
  isIndexingIncomplete,
  onEditBookmark,
  onDeleteBookmark,
  onMoveBookmark,
}: BookmarksContentProps) {
  const viewMode = useGeneralStore((state) => state.viewMode);
  const openInNewTab = useGeneralStore((state) => state.openInNewTab);
  const showFavicons = useGeneralStore((state) => state.showFavicons);
  const [showLatency, setShowLatency] = useState(false);
  const shouldAnimateList =
    !isSemanticLoading && searchQuery.trim().length === 0;
  const hasQuery = searchQuery.trim().length > 0;
  const showSemanticStrip = hasQuery && searchMode === "semantic";

  useEffect(() => {
    if (!showSemanticStrip || isSemanticLoading || semanticLatencyMs === null) {
      setShowLatency(false);
      return;
    }
    setShowLatency(true);
    const timeoutId = window.setTimeout(() => {
      setShowLatency(false);
    }, 2000);
    return () => window.clearTimeout(timeoutId);
  }, [isSemanticLoading, semanticLatencyMs, showSemanticStrip]);

  const statusText = useMemo(() => {
    if (!showSemanticStrip) {
      return null;
    }
    if (isSemanticLoading) {
      return stageLabel(semanticStage);
    }
    if (!showLatency || semanticLatencyMs === null) {
      return null;
    }
    return `Semantic${isIndexingIncomplete ? " · partial" : ""} · ${semanticLatencyMs}ms`;
  }, [
    isIndexingIncomplete,
    isSemanticLoading,
    semanticLatencyMs,
    semanticStage,
    showLatency,
    showSemanticStrip,
  ]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading your bookmarks...
      </div>
    );
  }

  if (bookmarksCount === 0) {
    return <ImportGuide />;
  }

  return (
    <div className="relative h-full">
      {showSemanticStrip && statusText && (
        <div className="sticky top-0 z-20 mb-2 rounded-md border border-border/60 bg-background/95 px-2 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            {isSemanticLoading ? (
              <Loader2 className="size-3.5 shrink-0 animate-spin" />
            ) : null}
            <span>{statusText}</span>
          </div>
        </div>
      )}
      {filteredBookmarks.length === 0 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 text-center">
          <div className="bg-muted flex size-12 items-center justify-center rounded-lg">
            <BookmarkIcon className="text-muted-foreground size-6" />
          </div>
          <div>
            <p className="text-sm font-medium">No bookmarks found</p>
            <p className="text-muted-foreground text-sm">
              {searchQuery
                ? "Try a different search term"
                : "Add your first bookmark to get started"}
            </p>
          </div>
        </div>
      )}
      {viewMode === "details" && <DetailsHeaderRow />}
      {shouldAnimateList ? (
        <FlipReveal
          keys={filteredBookmarks.map((b) => String(b.id))}
          showClass="block"
          hideClass="hidden"
        >
          <div className={cn(getViewModeGridClasses(viewMode))}>
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
                    folderName={folderNameById[bookmark.folderId] ?? "Unsorted"}
                    viewMode={viewMode}
                    openInNewTab={openInNewTab}
                    showFavicons={showFavicons}
                    onEdit={onEditBookmark}
                    onDelete={onDeleteBookmark}
                    onMove={onMoveBookmark}
                    folders={editableFolders}
                    priority={filteredBookmarks[0]?.id === bookmark.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </FlipReveal>
      ) : (
        <div className={cn(getViewModeGridClasses(viewMode))}>
          {filteredBookmarks.map((bookmark) => (
            <div key={bookmark.id} data-flip={String(bookmark.id)}>
              <BookmarkCard
                bookmark={bookmark}
                folderName={folderNameById[bookmark.folderId] ?? "Unsorted"}
                viewMode={viewMode}
                openInNewTab={openInNewTab}
                showFavicons={showFavicons}
                onEdit={onEditBookmark}
                onDelete={onDeleteBookmark}
                onMove={onMoveBookmark}
                folders={editableFolders}
                priority={filteredBookmarks[0]?.id === bookmark.id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
