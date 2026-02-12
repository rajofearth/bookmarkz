"use client";

import {
  BookmarkIcon,
  ChevronRightIcon,
  FolderIcon,
  SearchIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ElementType, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import dynamic from "next/dynamic";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EditBookmarkDialog } from "./edit-bookmark-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileLayout } from "./mobile-layout";
import { FoldersListView } from "./folders-list-view";
import { FolderDetailView } from "./folder-detail-view";
import { ProfileTab } from "./profile-tab";

const AddBookmarkDialog = dynamic(
  () => import("./add-bookmark-dialog").then((mod) => ({ default: mod.AddBookmarkDialog })),
  { ssr: false }
);
import { BookmarkCard } from "./bookmark-card";
import { FoldersSidebar } from "./folders-sidebar";
import { MetadataFetcher } from "./metadata-fetcher";
import { FlipReveal, FlipRevealItem } from "@/components/gsap/flip-reveal";
import { ImportGuide } from "@/components/onboarding/import-guide";
import { DisplayControlsMenu } from "./display-controls-menu";
import { useGeneralStore } from "@/hooks/use-general-store";
import type { Bookmark, Folder, DragData } from "./types";
import type { Id } from "@/convex/_generated/dataModel";

interface DesktopBookmarksHeaderProps {
  currentFolderName?: string;
  CurrentFolderIcon?: ElementType;
  sidebarOpen: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onToggleSidebar: () => void;
  addBookmarkButton: ReactNode;
}

function DesktopBookmarksHeader({
  currentFolderName,
  CurrentFolderIcon,
  sidebarOpen,
  searchQuery,
  onSearchChange,
  onToggleSidebar,
  addBookmarkButton,
}: DesktopBookmarksHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onToggleSidebar}
        className="shrink-0"
      >
        <ChevronRightIcon
          className={cn(
            "size-4 transition-transform",
            sidebarOpen && "rotate-180",
          )}
        />
      </Button>

      <div className="flex items-center gap-2 min-w-0">
        {CurrentFolderIcon ? (
          <CurrentFolderIcon className="text-muted-foreground size-4" />
        ) : (
          <FolderIcon className="text-muted-foreground size-4" />
        )}
        <h1 className="text-sm font-medium truncate">{currentFolderName}</h1>
      </div>

      <div className="relative ml-auto max-w-xs flex-1">
        <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          id="search-input-desktop"
          type="search"
          placeholder="Search bookmarks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 pl-9 text-sm"
        />
      </div>

      <DisplayControlsMenu />
      {addBookmarkButton}
    </div>
  );
}

interface MobileBookmarksHeaderProps {
  currentFolderName?: string;
  CurrentFolderIcon?: ElementType;
  showMobileSearch: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onToggleSearch: () => void;
  addBookmarkButton: ReactNode;
}

function MobileBookmarksHeader({
  currentFolderName,
  CurrentFolderIcon,
  showMobileSearch,
  searchQuery,
  onSearchChange,
  onToggleSearch,
  addBookmarkButton,
}: MobileBookmarksHeaderProps) {
  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {CurrentFolderIcon ? (
            <CurrentFolderIcon className="text-muted-foreground size-4 shrink-0" />
          ) : (
            <FolderIcon className="text-muted-foreground size-4 shrink-0" />
          )}
          <h1 className="text-sm font-medium truncate">{currentFolderName}</h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="icon-sm" onClick={onToggleSearch}>
            <SearchIcon className="size-4" />
          </Button>
          <DisplayControlsMenu />
          {addBookmarkButton}
        </div>
      </div>

      {showMobileSearch && (
        <div className="px-4 pb-3 border-t border-border/50">
          <div className="relative">
            <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              id="search-input"
              type="search"
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 pl-9 text-sm w-full"
              autoFocus={showMobileSearch}
            />
          </div>
        </div>
      )}
    </>
  );
}

export function BookmarksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [activeBookmarkId, setActiveBookmarkId] = useState<string | null>(null);

  // Mobile tab state
  const [activeTab, setActiveTab] = useState<"home" | "folders" | "profile">("home");
  const [mobileSelectedFolder, setMobileSelectedFolder] = useState<string | null>(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const { viewMode, sortMode } = useGeneralStore();

  useEffect(() => {
    if (searchParams.get("tab") === "profile") {
      setActiveTab("profile");
      router.replace("/bookmarks", { scroll: false });
    }
  }, [searchParams, router]);

  // Convex hooks
  const convexFolders = useQuery(api.bookmarks.getFolders);
  const convexBookmarks = useQuery(api.bookmarks.getBookmarks);

  const isLoading = convexFolders === undefined || convexBookmarks === undefined;

  const createBookmarkMutation = useMutation(api.bookmarks.createBookmark);
  const updateBookmarkMutation = useMutation(api.bookmarks.updateBookmark);
  const deleteBookmarkMutation = useMutation(api.bookmarks.deleteBookmark);
  const createFolderMutation = useMutation(api.bookmarks.createFolder);
  // const updateFolderMutation = useMutation(api.bookmarks.updateFolder);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor),
  );

  // Transform Convex data to frontend types
  const bookmarks: Bookmark[] = useMemo(() => {
    if (!convexBookmarks) return [];
    return convexBookmarks.map((b) => ({
      id: b._id,
      title: b.title,
      url: b.url,
      favicon: b.favicon,
      ogImage: b.ogImage,
      folderId: b.folderId ?? "all",
      createdAt: new Date(b.createdAt),
    }));
  }, [convexBookmarks]);

  const folders: Folder[] = useMemo(() => {
    const staticFolders: Folder[] = [
      { id: "all", name: "All Bookmarks", count: 0, icon: BookmarkIcon },
    ];

    if (!convexFolders) return staticFolders;

    const dynamicFolders = convexFolders.map((f) => ({
      id: f._id,
      name: f.name,
      count: 0, // Will be calculated below
    }));

    const allFolders = [...staticFolders, ...dynamicFolders];

    // Calculate counts
    if (convexBookmarks) {
      const counts: Record<string, number> = {};
      convexBookmarks.forEach((b) => {
        // Count for "All Bookmarks"
        counts["all"] = (counts["all"] || 0) + 1;

        // Count for specific folder
        if (b.folderId) {
          counts[b.folderId] = (counts[b.folderId] || 0) + 1;
        }
      });

      return allFolders.map(f => ({
        ...f,
        count: counts[f.id] || 0
      }));
    }

    return allFolders;
  }, [convexFolders, convexBookmarks]);


  // Filter bookmarks based on folder and search
  const filteredBookmarks = useMemo(() => {
    let result = bookmarks;

    if (selectedFolder !== "all") {
      result = bookmarks.filter((b) => b.folderId === selectedFolder);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.url.toLowerCase().includes(query),
      );
    }

    return result;
  }, [bookmarks, selectedFolder, searchQuery]);

  const sortedFilteredBookmarks = useMemo(() => {
    return [...filteredBookmarks].sort((a, b) => {
      const aTime = a.createdAt.getTime();
      const bTime = b.createdAt.getTime();
      return sortMode === "newest" ? bTime - aTime : aTime - bTime;
    });
  }, [filteredBookmarks, sortMode]);

  // On mobile home tab, always show "All Bookmarks"; on desktop use selected folder
  const effectiveSelectedFolder = isMobile ? "all" : selectedFolder;
  const effectiveFilteredBookmarks = useMemo(() => {
    const sortBookmarks = (items: Bookmark[]) =>
      [...items].sort((a, b) => {
        const aTime = a.createdAt.getTime();
        const bTime = b.createdAt.getTime();
        return sortMode === "newest" ? bTime - aTime : aTime - bTime;
      });

    if (isMobile) {
      if (!searchQuery) return sortBookmarks(bookmarks);
      const query = searchQuery.toLowerCase();
      return sortBookmarks(
        bookmarks.filter(
          (b) =>
            b.title.toLowerCase().includes(query) ||
            b.url.toLowerCase().includes(query),
        ),
      );
    }
    return sortedFilteredBookmarks;
  }, [isMobile, bookmarks, searchQuery, sortedFilteredBookmarks, sortMode]);
  const effectiveCurrentFolder = folders.find((f) => f.id === effectiveSelectedFolder);
  const folderNameById = useMemo(() => {
    return folders.reduce<Record<string, string>>((acc, folder) => {
      acc[folder.id] = folder.name;
      return acc;
    }, { all: "All Bookmarks" });
  }, [folders]);

  // Folders available for selection when adding a bookmark
  // Exclude "all" from the dropdown list
  const editableFolders = folders.filter(
    (f) => f.id !== "all",
  );

  const handleMoveBookmark = async (bookmarkId: string, folderId: string) => {
    if (!folderId || folderId === "all") return;

    try {
      await updateBookmarkMutation({
        bookmarkId: bookmarkId as Id<"bookmarks">,
        folderId: folderId as Id<"folders">,
      });
    } catch (error) {
      console.error("Failed to move bookmark:", error);
    }
  };

  // Add new bookmark
  const handleAddBookmark = async (data: {
    url: string;
    title: string;
    favicon: string | null;
    ogImage: string | null;
    folderId: string;
  }) => {
    try {
      await createBookmarkMutation({
        url: data.url,
        title: data.title,
        favicon: data.favicon ?? undefined,
        ogImage: data.ogImage ?? undefined,
        folderId: data.folderId && data.folderId !== "all"
          ? (data.folderId as Id<"folders">)
          : undefined,
      });
    } catch (error) {
      console.error("Failed to create bookmark:", error);
    }
  };

  // Add new folder
  const handleAddFolder = async (name: string) => {
    try {
      await createFolderMutation({ name });
    } catch (error) {
      console.error("Failed to create folder:", error);
    }
  };

  // Edit bookmark
  const handleEditBookmark = async (
    bookmarkId: string,
    data: {
      url: string;
      title: string;
      favicon: string | null;
      ogImage: string | null;
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
        folderId: data.folderId && data.folderId !== "all"
          ? (data.folderId as Id<"folders">)
          : undefined,
      });
    } catch (error) {
      console.error("Failed to update bookmark:", error);
    }
  };

  // Delete bookmark
  const handleDeleteBookmark = async (bookmark: Bookmark) => {
    try {
      await deleteBookmarkMutation({ bookmarkId: bookmark.id as Id<"bookmarks"> });
    } catch (error) {
      console.error("Failed to delete bookmark:", error);
    }
  };

  // Handle drag end for moving bookmarks to folders
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const activeData = event.active.data.current as DragData | null;

      if (!activeData || activeData.type !== "bookmark") return;

      setActiveBookmarkId(activeData.bookmarkId);
    },
    [],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      try {
        const { active, over } = event;

        if (!over) return;

        const activeData = active.data.current as DragData | null;
        const overData = over.data.current as DragData | null;

        if (!activeData || !overData) return;

        if (activeData.type !== "bookmark" || overData.type !== "folder") {
          return;
        }

        const bookmarkId = activeData.bookmarkId;
        const folderId = overData.folderId;

        // Validate that target is a user-created folder (not "all")
        if (folderId === "all") {
          return;
        }

        // Check if bookmark is already in this folder
        const bookmark = bookmarks.find((b) => b.id === bookmarkId);
        if (bookmark && bookmark.folderId === folderId) {
          return;
        }

        try {
          await updateBookmarkMutation({
            bookmarkId: bookmarkId as Id<"bookmarks">,
            folderId: folderId as Id<"folders">,
          });
        } catch (error) {
          console.error("Failed to move bookmark:", error);
        }
      } finally {
        setActiveBookmarkId(null);
      }
    },
    [bookmarks, updateBookmarkMutation],
  );

  const handleDragCancel = useCallback(() => {
    setActiveBookmarkId(null);
  }, []);

  const activeBookmark = useMemo(
    () => bookmarks.find((b) => b.id === activeBookmarkId) ?? null,
    [bookmarks, activeBookmarkId],
  );

  // Mobile: Filter bookmarks for selected folder
  const mobileFolderBookmarks = useMemo(() => {
    if (!mobileSelectedFolder) return [];
    if (mobileSelectedFolder === "all") return bookmarks;
    return bookmarks.filter((b) => b.folderId === mobileSelectedFolder);
  }, [bookmarks, mobileSelectedFolder]);

  const mobileSelectedFolderData = useMemo(() => {
    if (!mobileSelectedFolder) return null;
    return folders.find((f) => f.id === mobileSelectedFolder) ?? null;
  }, [folders, mobileSelectedFolder]);

  // Render main content (used for both desktop and mobile home tab)
  const renderMainContent = () => (
    <main className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="border-border border-b bg-background">
        {isMobile ? (
          <MobileBookmarksHeader
            currentFolderName={effectiveCurrentFolder?.name}
            CurrentFolderIcon={effectiveCurrentFolder?.icon}
            showMobileSearch={showMobileSearch}
            searchQuery={searchQuery}
            onSearchChange={(value) => {
              setSearchQuery(value);
              if (value === "") {
                setShowMobileSearch(false);
              }
            }}
            onToggleSearch={() => setShowMobileSearch(!showMobileSearch)}
            addBookmarkButton={(
              <AddBookmarkDialog
                folders={editableFolders}
                onSubmit={handleAddBookmark}
              />
            )}
          />
        ) : (
          <DesktopBookmarksHeader
            currentFolderName={effectiveCurrentFolder?.name}
            CurrentFolderIcon={effectiveCurrentFolder?.icon}
            sidebarOpen={sidebarOpen}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            addBookmarkButton={(
              <AddBookmarkDialog
                folders={editableFolders}
                onSubmit={handleAddBookmark}
              />
            )}
          />
        )}
      </header>

      {/* Bookmarks Grid */}
      <div
        className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4"
        style={{
          paddingBottom: isMobile ? "calc(5rem + env(safe-area-inset-bottom))" : undefined
        }}
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading your bookmarks...
          </div>
        ) : bookmarks.length === 0 ? (
          <ImportGuide />
        ) : (
          <div className="relative h-full">
            {effectiveFilteredBookmarks.length === 0 && (
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
            {/* Details header row */}
            {viewMode === "details" && (
              <div className="flex items-center gap-3 px-3 py-2 border-b border-border text-xs font-medium text-muted-foreground">
                <span className="w-6 shrink-0" />
                <span className="flex-1">Name</span>
                <span className="hidden sm:block w-36 text-right">URL</span>
                <span className="hidden lg:block w-32 text-right">Folder</span>
                <span className="hidden md:block w-28 text-right">Date Added</span>
                <span className="w-6 shrink-0" />
              </div>
            )}
            <FlipReveal
              keys={effectiveFilteredBookmarks.map((b) => String(b.id))}
              showClass="block"
              hideClass="hidden"
            >
              <div className={cn(
                viewMode === "normal" && "grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
                viewMode === "compact" && "grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
                viewMode === "list" && "flex flex-col gap-1",
                viewMode === "details" && "flex flex-col gap-0",
              )}>
                {effectiveFilteredBookmarks.map((bookmark) => (
                  <FlipRevealItem key={bookmark.id} flipKey={String(bookmark.id)}>
                    <BookmarkCard
                      bookmark={bookmark}
                      folderName={folderNameById[bookmark.folderId] ?? "Unsorted"}
                      viewMode={viewMode}
                      onEdit={setEditingBookmark}
                      onDelete={handleDeleteBookmark}
                      onMove={handleMoveBookmark}
                      folders={editableFolders}
                      priority={effectiveFilteredBookmarks[0]?.id === bookmark.id}
                    />
                  </FlipRevealItem>
                ))}
              </div>
            </FlipReveal>
          </div>
        )}
      </div>
    </main>
  );

  // Mobile folders content
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
      />
    );
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
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
          {/* Sidebar */}
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
              onSettings={() => router.push("/settings")}
            />
          </aside>

          {/* Main Content */}
          {renderMainContent()}
        </div>
      )}

      {/* Edit Bookmark Dialog */}
      <EditBookmarkDialog
        bookmark={editingBookmark}
        folders={editableFolders}
        open={editingBookmark !== null}
        onOpenChange={(open) => !open && setEditingBookmark(null)}
        onSubmit={handleEditBookmark}
      />
      <MetadataFetcher />

      <DragOverlay>
        {activeBookmark ? (
          <BookmarkCard
            bookmark={activeBookmark}
            onEdit={setEditingBookmark}
            onDelete={handleDeleteBookmark}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
