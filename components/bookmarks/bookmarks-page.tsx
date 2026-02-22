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
import { useMutation } from "convex/react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useBookmarksData } from "@/hooks/use-bookmarks-data";
import { useBookmarksFilters } from "@/hooks/use-bookmarks-filters";
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
import { FolderDetailView } from "./folder-detail-view";
import { FoldersListView } from "./folders-list-view";
import { FoldersSidebar } from "./folders-sidebar";
import { MetadataFetcher } from "./metadata-fetcher";
import { MobileLayout } from "./mobile-layout";
import { ProfileTab } from "./profile-tab";
import type { Bookmark, DragData } from "./types";

const AddBookmarkDialog = dynamic(
  () =>
    import("./add-bookmark-dialog").then((mod) => ({
      default: mod.AddBookmarkDialog,
    })),
  { ssr: false },
);

export function BookmarksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [selectedFolder, setSelectedFolder] = useState<string>(FOLDER_ID_ALL);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [activeBookmarkId, setActiveBookmarkId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"home" | "folders" | "profile">(
    "home",
  );
  const [mobileSelectedFolder, setMobileSelectedFolder] = useState<
    string | null
  >(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const { viewMode, sortMode } = useGeneralStore();
  const {
    autoIndexing,
    semanticSearchEnabled,
    indexBookmark,
    clearBookmarkHash,
  } = useSemanticIndexer();

  const { bookmarks, folders, folderNameById, editableFolders, isLoading } =
    useBookmarksData();

  const { effectiveFilteredBookmarks } = useBookmarksFilters({
    bookmarks,
    selectedFolder,
    searchQuery,
    sortMode,
    isMobile,
  });

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
      if (mobileSelectedFolder === folderId) {
        setMobileSelectedFolder(null);
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
        void clearBookmarkHash(bookmark.id);
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

  const mobileFolderBookmarks = useMemo(() => {
    if (!mobileSelectedFolder) return [];
    if (mobileSelectedFolder === "all") return bookmarks;
    return bookmarks.filter((b) => b.folderId === mobileSelectedFolder);
  }, [bookmarks, mobileSelectedFolder]);

  const mobileSelectedFolderData = useMemo(
    () =>
      mobileSelectedFolder
        ? (folders.find((f) => f.id === mobileSelectedFolder) ?? null)
        : null,
    [folders, mobileSelectedFolder],
  );

  const addBookmarkButton = (
    <AddBookmarkDialog folders={editableFolders} onSubmit={handleAddBookmark} />
  );

  const renderMainContent = () => (
    <main className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <header className="border-border border-b bg-background">
        {isMobile ? (
          <MobileBookmarksHeader
            currentFolderName={effectiveCurrentFolder?.name}
            CurrentFolderIcon={effectiveCurrentFolder?.icon}
            showMobileSearch={showMobileSearch}
            searchQuery={searchQuery}
            onSearchChange={(value) => {
              setSearchQuery(value);
              if (value === "") setShowMobileSearch(false);
            }}
            onToggleSearch={() => setShowMobileSearch(!showMobileSearch)}
            addBookmarkButton={addBookmarkButton}
          />
        ) : (
          <DesktopBookmarksHeader
            currentFolderName={effectiveCurrentFolder?.name}
            CurrentFolderIcon={effectiveCurrentFolder?.icon}
            sidebarOpen={sidebarOpen}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            addBookmarkButton={addBookmarkButton}
          />
        )}
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-4">
        <BookmarksContent
          isLoading={isLoading}
          bookmarksCount={bookmarks.length}
          filteredBookmarks={effectiveFilteredBookmarks}
          folderNameById={folderNameById}
          editableFolders={editableFolders}
          searchQuery={searchQuery}
          onEditBookmark={setEditingBookmark}
          onDeleteBookmark={handleDeleteBookmark}
          onMoveBookmark={handleMoveBookmark}
        />
      </div>
    </main>
  );

  const renderMobileFoldersContent = () => {
    if (mobileSelectedFolder && mobileSelectedFolderData) {
      return (
        <FolderDetailView
          folder={mobileSelectedFolderData}
          bookmarks={mobileFolderBookmarks}
          editableFolders={editableFolders}
          onBack={() => setMobileSelectedFolder(null)}
          onEditBookmark={setEditingBookmark}
          onDeleteBookmark={handleDeleteBookmark}
          onAddBookmark={handleAddBookmark}
        />
      );
    }
    return (
      <FoldersListView
        folders={folders}
        onSelectFolder={(folderId) => setMobileSelectedFolder(folderId)}
        onAddFolder={handleAddFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
      />
    );
  };

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
          homeContent={renderMainContent()}
          foldersContent={renderMobileFoldersContent()}
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
              onSelectFolder={setSelectedFolder}
              onAddFolder={handleAddFolder}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
              onSettings={() => router.push("/settings")}
            />
          </aside>
          {renderMainContent()}
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
