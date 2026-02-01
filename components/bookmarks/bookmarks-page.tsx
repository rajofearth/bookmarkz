"use client";

import {
  BookmarkIcon,
  ChevronRightIcon,
  FolderIcon,
  SearchIcon,
  StarIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AddBookmarkDialog } from "./add-bookmark-dialog";
import { EditBookmarkDialog } from "./edit-bookmark-dialog";
import { BookmarkCard } from "./bookmark-card";
import { FoldersSidebar } from "./folders-sidebar";
import { MetadataFetcher } from "./metadata-fetcher";
import type { Bookmark, Folder } from "./types";
import type { Id } from "@/convex/_generated/dataModel";

export function BookmarksPage() {
  const router = useRouter();
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

  // Convex hooks
  const convexFolders = useQuery(api.bookmarks.getFolders);
  const convexBookmarks = useQuery(api.bookmarks.getBookmarks);

  const createBookmarkMutation = useMutation(api.bookmarks.createBookmark);
  const updateBookmarkMutation = useMutation(api.bookmarks.updateBookmark);
  const deleteBookmarkMutation = useMutation(api.bookmarks.deleteBookmark);
  const createFolderMutation = useMutation(api.bookmarks.createFolder);
  // const updateFolderMutation = useMutation(api.bookmarks.updateFolder);
  const deleteFolderMutation = useMutation(api.bookmarks.deleteFolder);

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
      { id: "favorites", name: "Favorites", count: 0, icon: StarIcon },
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

        // Logic for favorites - currently based on folderId="favorites" in the old code,
        // but typically favorites is a flag. The old code used folderId="favorites".
        // If we want to support that legacy way:
        if (b.folderId === "favorites") {
          counts["favorites"] = (counts["favorites"] || 0) + 1;
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
      // For favorites, if we use folderId strategy
      if (selectedFolder === "favorites") {
        result = bookmarks.filter((b) => b.folderId === "favorites");
      } else {
        result = bookmarks.filter((b) => b.folderId === selectedFolder);
      }
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

  const currentFolder = folders.find((f) => f.id === selectedFolder);

  // Folders available for selection when adding a bookmark
  // Exclude "all" and "favorites" from the dropdown list for now unless we want to allow moving to favorites directly
  const editableFolders = folders.filter(
    (f) => f.id !== "all" && f.id !== "favorites",
  );

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
        folderId: data.folderId && data.folderId !== "all" && data.folderId !== "favorites"
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
        folderId: data.folderId && data.folderId !== "all" && data.folderId !== "favorites"
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

  return (
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
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="border-border flex items-center gap-3 border-b px-4 py-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="shrink-0"
          >
            <ChevronRightIcon
              className={cn(
                "size-4 transition-transform",
                sidebarOpen && "rotate-180",
              )}
            />
          </Button>

          <div className="flex items-center gap-2">
            {currentFolder?.icon ? (
              <currentFolder.icon className="text-muted-foreground size-4" />
            ) : (
              <FolderIcon className="text-muted-foreground size-4" />
            )}
            <h1 className="text-sm font-medium">{currentFolder?.name}</h1>
          </div>

          <div className="relative ml-auto max-w-xs flex-1">
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
            onSubmit={handleAddBookmark}
          />
        </header>

        {/* Bookmarks Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredBookmarks.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
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
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBookmarks.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onEdit={setEditingBookmark}
                  onDelete={handleDeleteBookmark}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Edit Bookmark Dialog */}
      <EditBookmarkDialog
        bookmark={editingBookmark}
        folders={editableFolders}
        open={editingBookmark !== null}
        onOpenChange={(open) => !open && setEditingBookmark(null)}
        onSubmit={handleEditBookmark}
      />
      <MetadataFetcher />
    </div>
  );
}
