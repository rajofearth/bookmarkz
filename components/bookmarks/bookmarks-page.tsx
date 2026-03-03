"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { useMutation, useQuery } from "convex/react";
import { X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useBookmarksData } from "@/hooks/use-bookmarks-data";
import { useBookmarksFilters } from "@/hooks/use-bookmarks-filters";
import { useExtensionInstallDetection } from "@/hooks/use-extension-install-detection";
import { useGeneralStore } from "@/hooks/use-general-store";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSemanticIndexer } from "@/hooks/use-semantic-indexer";
import { FOLDER_ID_ALL, toConvexFolderId } from "@/lib/bookmarks-utils";
import { cn } from "@/lib/utils";
import { BookmarkCard } from "./bookmark-card";
import { BookmarksContent } from "./bookmarks-content";
import {
  DesktopBookmarksHeader,
  MobileBookmarksHeader,
} from "./bookmarks-header";
import { EditBookmarkDialog } from "./edit-bookmark-dialog";
import { FoldersContent } from "./folders-content";
import { FoldersSidebar } from "./folders-sidebar";
import { MetadataFetcher } from "./metadata-fetcher";
import { MobileLayout } from "./mobile-layout";
import { ProfileTab } from "./profile-tab";
import type { SearchMode } from "./search-types";
import type { Bookmark, DragData } from "./types";

const AddBookmarkDialog = dynamic(
  () =>
    import("./add-bookmark-dialog").then((mod) => ({
      default: mod.AddBookmarkDialog,
    })),
  { ssr: false },
);

const AddFolderDialog = dynamic(
  () =>
    import("./add-folder-dialog").then((mod) => ({
      default: mod.AddFolderDialog,
    })),
  { ssr: false },
);

export function BookmarksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const {
    showBanner: showExtensionBanner,
    dismissBanner: dismissExtensionBanner,
  } = useExtensionInstallDetection(isMobile);
  const [selectedFolder, setSelectedFolder] = useState<string>(FOLDER_ID_ALL);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [activeBookmarkId, setActiveBookmarkId] = useState<string | null>(null);
  const [contentMode, setContentMode] = useState<"bookmarks" | "folders">(
    "bookmarks",
  );
  const [activeTab, setActiveTab] = useState<"home" | "folders" | "profile">(
    "home",
  );
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchModeOverride, setSearchModeOverride] =
    useState<SearchMode>("semantic");
  const hasShownSemanticWarningRef = useRef(false);
  const hasTriggeredStatsRepairRef = useRef(false);
  const { viewMode, sortMode } = useGeneralStore();
  const {
    autoIndexing,
    semanticSearchEnabled,
    indexBookmark,
    clearBookmarkHash,
  } = useSemanticIndexer();

  const {
    bookmarks,
    folders,
    folderNameById,
    editableFolders,
    folderViewItems,
    isLoading,
  } = useBookmarksData();
  const embeddingStats = useQuery(api.bookmarks.getEmbeddingIndexStats);
  const isFolderSearchMode =
    (isMobile ? activeTab === "folders" : contentMode === "folders") &&
    Array.isArray(folderViewItems);

  const {
    effectiveFilteredBookmarks,
    sortedFilteredFolders,
    isSemanticLoading,
    semanticStage,
    searchMode,
    lastSemanticDurationMs,
  } = useBookmarksFilters({
    bookmarks,
    folderViewItems,
    selectedFolder,
    searchQuery,
    sortMode,
    isMobile,
    searchModeOverride: isFolderSearchMode ? false : searchModeOverride,
  });

  useEffect(() => {
    if (!semanticSearchEnabled) {
      setSearchModeOverride("lexical");
    }
  }, [semanticSearchEnabled]);

  const handleSearchModeChange = useCallback(
    (mode: SearchMode) => {
      if (!semanticSearchEnabled) {
        return;
      }
      setSearchModeOverride(mode);
    },
    [semanticSearchEnabled],
  );

  const pendingCount = embeddingStats?.pendingBookmarks ?? 0;
  const staleCount = embeddingStats?.staleBookmarks ?? 0;
  const indexedCount = embeddingStats?.indexedBookmarks ?? 0;
  const totalCount = embeddingStats?.totalBookmarks ?? 0;
  const isIndexingIncomplete = pendingCount + staleCount > 0;

  useEffect(() => {
    if (isFolderSearchMode) {
      hasShownSemanticWarningRef.current = false;
      return;
    }
    const query = searchQuery.trim();
    const shouldWarn =
      semanticSearchEnabled &&
      searchMode === "semantic" &&
      query.length > 0 &&
      isIndexingIncomplete;

    if (!shouldWarn) {
      hasShownSemanticWarningRef.current = false;
      return;
    }

    if (hasShownSemanticWarningRef.current) {
      return;
    }

    hasShownSemanticWarningRef.current = true;
    toast.warning(
      `Semantic results may be incomplete — ${pendingCount} pending, ${staleCount} stale`,
      {
        description: `${indexedCount}/${totalCount} indexed. You can run indexing in Settings.`,
        action: {
          label: "Index now",
          onClick: () => router.push("/settings"),
        },
      },
    );
  }, [
    indexedCount,
    pendingCount,
    staleCount,
    totalCount,
    isIndexingIncomplete,
    router,
    searchMode,
    searchQuery,
    semanticSearchEnabled,
    isFolderSearchMode,
  ]);

  useEffect(() => {
    if (searchParams.get("tab") === "profile") {
      setActiveTab("profile");
      router.replace("/bookmarks", { scroll: false });
    }
  }, [searchParams, router]);

  const createBookmarkMutation = useMutation(api.bookmarks.createBookmark);
  const updateBookmarkMutation = useMutation(api.bookmarks.updateBookmark);
  const deleteBookmarkMutation = useMutation(api.bookmarks.deleteBookmark);
  const createFolderMutation = useMutation(api.bookmarks.createFolder);
  const updateFolderMutation = useMutation(api.bookmarks.updateFolder);
  const deleteFolderMutation = useMutation(api.bookmarks.deleteFolder);
  const repairEmbeddingIndexStatsMutation = useMutation(
    api.bookmarks.repairEmbeddingIndexStats,
  );

  useEffect(() => {
    if (hasTriggeredStatsRepairRef.current || typeof window === "undefined") {
      return;
    }

    const repairKey = "bukmarks.embedding-index-stats-repair.v1";
    if (window.sessionStorage.getItem(repairKey) === "done") {
      hasTriggeredStatsRepairRef.current = true;
      return;
    }

    hasTriggeredStatsRepairRef.current = true;
    window.sessionStorage.setItem(repairKey, "done");
    void repairEmbeddingIndexStatsMutation({}).catch((error) => {
      window.sessionStorage.removeItem(repairKey);
      console.error("Failed to repair embedding index stats:", error);
    });
  }, [repairEmbeddingIndexStatsMutation]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor),
  );

  const effectiveSelectedFolder = isMobile ? FOLDER_ID_ALL : selectedFolder;
  const effectiveCurrentFolder = folders.find(
    (f) => f.id === effectiveSelectedFolder,
  );

  const handleMoveBookmark = useCallback(
    async (bookmarkId: string, folderId: string) => {
      const convexFolderId = toConvexFolderId(folderId);
      if (!convexFolderId) return;
      try {
        await updateBookmarkMutation({
          bookmarkId: bookmarkId as Id<"bookmarks">,
          folderId: convexFolderId,
        });
      } catch (error) {
        console.error("Failed to move bookmark:", error);
      }
    },
    [updateBookmarkMutation],
  );

  const handleAddBookmark = async (data: {
    url: string;
    title: string;
    favicon: string | null;
    ogImage: string | null;
    description: string | null;
    folderId: string;
  }) => {
    try {
      const createdBookmarkId = await createBookmarkMutation({
        url: data.url,
        title: data.title,
        favicon: data.favicon ?? undefined,
        ogImage: data.ogImage ?? undefined,
        description: data.description ?? undefined,
        folderId: toConvexFolderId(data.folderId),
      });
      if (autoIndexing && semanticSearchEnabled) {
        void indexBookmark({
          id: createdBookmarkId,
          title: data.title,
          url: data.url,
          description: data.description ?? undefined,
        }).catch((error) => {
          console.error(
            "Semantic auto-index failed after bookmark create:",
            error,
          );
        });
      }
    } catch (error) {
      console.error("Failed to create bookmark:", error);
    }
  };

  const handleAddFolder = async (name: string) => {
    try {
      await createFolderMutation({ name });
    } catch (error) {
      console.error("Failed to create folder:", error);
    }
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    const convexFolderId = toConvexFolderId(folderId);
    if (!convexFolderId) return;
    try {
      await updateFolderMutation({ folderId: convexFolderId, name: newName });
    } catch (error) {
      console.error("Failed to rename folder:", error);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    const convexFolderId = toConvexFolderId(folderId);
    if (!convexFolderId) return;
    try {
      await deleteFolderMutation({ folderId: convexFolderId });
      if (selectedFolder === folderId) {
        setSelectedFolder(FOLDER_ID_ALL);
      }
    } catch (error) {
      console.error("Failed to delete folder:", error);
    }
  };

  const handleEditBookmark = async (
    bookmarkId: string,
    data: {
      url: string;
      title: string;
      favicon: string | null;
      ogImage: string | null;
      description: string | null;
      folderId: string;
    },
  ) => {
    try {
      await updateBookmarkMutation({
        bookmarkId: bookmarkId as Id<"bookmarks">,
        url: data.url,
        title: data.title,
        favicon: data.favicon ?? undefined,
        ogImage: data.ogImage ?? undefined,
        description: data.description ?? undefined,
        folderId: toConvexFolderId(data.folderId),
      });
      if (autoIndexing && semanticSearchEnabled) {
        void indexBookmark({
          id: bookmarkId,
          title: data.title,
          url: data.url,
          description: data.description ?? undefined,
        }).catch((error) => {
          console.error(
            "Semantic auto-index failed after bookmark update:",
            error,
          );
        });
      }
    } catch (error) {
      console.error("Failed to update bookmark:", error);
    }
  };

  const handleDeleteBookmark = useCallback(
    async (bookmark: Bookmark) => {
      try {
        await deleteBookmarkMutation({
          bookmarkId: bookmark.id as Id<"bookmarks">,
        });
        void clearBookmarkHash(bookmark.id).catch((error) => {
          console.error("Failed to clear semantic bookmark hash:", error);
        });
      } catch (error) {
        console.error("Failed to delete bookmark:", error);
      }
    },
    [clearBookmarkHash, deleteBookmarkMutation],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeData = event.active.data.current as DragData | null;
    if (!activeData || activeData.type !== "bookmark") return;
    setActiveBookmarkId(activeData.bookmarkId);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      try {
        const { active, over } = event;
        if (!over) return;

        const activeData = active.data.current as DragData | null;
        const overData = over.data.current as DragData | null;
        if (!activeData || !overData) return;
        if (
          activeData.type !== "bookmark" ||
          overData.type !== "folder" ||
          overData.folderId === FOLDER_ID_ALL
        )
          return;

        const bookmark = bookmarks.find((b) => b.id === activeData.bookmarkId);
        if (bookmark && bookmark.folderId === overData.folderId) return;

        await updateBookmarkMutation({
          bookmarkId: activeData.bookmarkId as Id<"bookmarks">,
          folderId: overData.folderId as Id<"folders">,
        });
      } catch (error) {
        console.error("Failed to move bookmark:", error);
      } finally {
        setActiveBookmarkId(null);
      }
    },
    [bookmarks, updateBookmarkMutation],
  );

  const handleDragCancel = useCallback(() => setActiveBookmarkId(null), []);

  const activeBookmark = useMemo(
    () => bookmarks.find((b) => b.id === activeBookmarkId) ?? null,
    [bookmarks, activeBookmarkId],
  );

  const addBookmarkButton = (
    <AddBookmarkDialog folders={editableFolders} onSubmit={handleAddBookmark} />
  );
  const addFolderButton = <AddFolderDialog onSubmit={handleAddFolder} />;

  const openFolderFromGrid = (folderId: string) => {
    setSelectedFolder(folderId);
    if (isMobile) {
      setActiveTab("home");
    } else {
      setContentMode("bookmarks");
    }
  };

  const renderMainContent = (mode: "bookmarks" | "folders") => (
    <main className="flex flex-1 flex-col min-h-0 overflow-hidden">
      {showExtensionBanner ? (
        <div className="border-border/70 bg-card/60 border-b px-4 py-2.5">
          <div className="mx-auto flex w-full max-w-5xl items-center gap-2 text-sm">
            <p className="text-muted-foreground min-w-0 flex-1">
              Install our{" "}
              <Link
                href="/extension"
                className="text-foreground underline underline-offset-2"
              >
                browser extension
              </Link>{" "}
              to save links from any page.
            </p>
            <button
              type="button"
              onClick={dismissExtensionBanner}
              className="text-muted-foreground hover:text-foreground inline-flex size-7 items-center justify-center rounded-md border border-transparent transition-colors"
              aria-label="Dismiss extension prompt"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
      <header className="border-border border-b bg-background">
        {isMobile ? (
          <MobileBookmarksHeader
            currentFolderName={
              mode === "folders" ? "Folders" : effectiveCurrentFolder?.name
            }
            CurrentFolderIcon={
              mode === "folders" ? undefined : effectiveCurrentFolder?.icon
            }
            showMobileSearch={showMobileSearch}
            searchQuery={searchQuery}
            semanticSearchEnabled={
              mode === "bookmarks" ? semanticSearchEnabled : false
            }
            searchMode={searchMode}
            isSemanticLoading={isSemanticLoading}
            onSearchModeChange={handleSearchModeChange}
            searchPlaceholder={
              mode === "folders" ? "Search folders..." : "Search bookmarks..."
            }
            onSearchChange={(value) => {
              setSearchQuery(value);
              if (value === "") setShowMobileSearch(false);
            }}
            onToggleSearch={() => setShowMobileSearch(!showMobileSearch)}
            actionButton={
              mode === "folders" ? addFolderButton : addBookmarkButton
            }
          />
        ) : (
          <DesktopBookmarksHeader
            currentFolderName={
              mode === "folders" ? "Folders" : effectiveCurrentFolder?.name
            }
            CurrentFolderIcon={
              mode === "folders" ? undefined : effectiveCurrentFolder?.icon
            }
            sidebarOpen={sidebarOpen}
            searchQuery={searchQuery}
            semanticSearchEnabled={
              mode === "bookmarks" ? semanticSearchEnabled : false
            }
            searchMode={searchMode}
            isSemanticLoading={isSemanticLoading}
            onSearchModeChange={handleSearchModeChange}
            searchPlaceholder={
              mode === "folders" ? "Search folders..." : "Search bookmarks..."
            }
            onSearchChange={setSearchQuery}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            actionButton={
              mode === "folders" ? addFolderButton : addBookmarkButton
            }
          />
        )}
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-4">
        {mode === "folders" ? (
          <FoldersContent
            isLoading={isLoading}
            foldersCount={editableFolders.length}
            filteredFolders={sortedFilteredFolders}
            searchQuery={searchQuery}
            onOpenFolder={openFolderFromGrid}
          />
        ) : (
          <BookmarksContent
            isLoading={isLoading}
            bookmarksCount={bookmarks.length}
            filteredBookmarks={effectiveFilteredBookmarks}
            folderNameById={folderNameById}
            editableFolders={editableFolders}
            searchQuery={searchQuery}
            searchMode={searchMode}
            isSemanticLoading={isSemanticLoading}
            semanticStage={semanticStage}
            semanticLatencyMs={lastSemanticDurationMs}
            isIndexingIncomplete={isIndexingIncomplete}
            onEditBookmark={setEditingBookmark}
            onDeleteBookmark={handleDeleteBookmark}
            onMoveBookmark={handleMoveBookmark}
          />
        )}
      </div>
    </main>
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      modifiers={[restrictToWindowEdges]}
    >
      {isMobile ? (
        <MobileLayout
          activeTab={activeTab}
          onTabChange={setActiveTab}
          homeContent={renderMainContent("bookmarks")}
          foldersContent={renderMainContent("folders")}
          profileContent={<ProfileTab />}
        />
      ) : (
        <div className="bg-background text-foreground flex h-screen w-full">
          <aside
            className={cn(
              "border-border bg-card flex h-full flex-col border-r transition-all duration-200",
              sidebarOpen ? "w-64" : "w-0 overflow-hidden",
            )}
          >
            <FoldersSidebar
              folders={folders}
              selectedFolder={selectedFolder}
              contentMode={contentMode}
              onSelectContentMode={setContentMode}
              onSelectFolder={setSelectedFolder}
              onAddFolder={handleAddFolder}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
              onSettings={() => router.push("/settings")}
            />
          </aside>
          {renderMainContent(contentMode)}
        </div>
      )}

      <EditBookmarkDialog
        bookmark={editingBookmark}
        folders={editableFolders}
        open={editingBookmark !== null}
        onOpenChange={(open) => !open && setEditingBookmark(null)}
        onSubmit={handleEditBookmark}
      />
      <MetadataFetcher />

      <DragOverlay dropAnimation={null} modifiers={[restrictToWindowEdges]}>
        {activeBookmark ? (
          <div
            className={cn(
              (viewMode === "list" || viewMode === "details") &&
                "w-64 max-w-[min(80vw,320px)]",
            )}
          >
            <BookmarkCard
              bookmark={activeBookmark}
              folderName={folderNameById[activeBookmark.folderId] ?? "Unsorted"}
              viewMode={viewMode}
              onEdit={setEditingBookmark}
              onDelete={handleDeleteBookmark}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
