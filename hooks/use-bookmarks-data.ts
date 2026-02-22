"use client";

import { useQuery } from "convex/react";
import { BookmarkIcon } from "lucide-react";
import { useMemo } from "react";
import type {
  Bookmark,
  Folder,
  FolderViewItem,
} from "@/components/bookmarks/types";
import { api } from "@/convex/_generated/api";
import { FOLDER_ID_ALL, fromConvexFolderId } from "@/lib/bookmarks-utils";

export function useBookmarksData() {
  const convexFolders = useQuery(api.bookmarks.getFolders);
  const convexBookmarks = useQuery(api.bookmarks.getBookmarks);

  const isLoading =
    convexFolders === undefined || convexBookmarks === undefined;

  const bookmarks: Bookmark[] = useMemo(() => {
    if (!convexBookmarks) return [];
    return convexBookmarks.map((b) => ({
      id: b._id,
      title: b.title,
      url: b.url,
      favicon: b.favicon,
      ogImage: b.ogImage,
      description: b.description,
      folderId: fromConvexFolderId(b.folderId),
      createdAt: new Date(b.createdAt),
    }));
  }, [convexBookmarks]);

  const folders: Folder[] = useMemo(() => {
    const staticFolders: Folder[] = [
      {
        id: FOLDER_ID_ALL,
        name: "All Bookmarks",
        count: 0,
        icon: BookmarkIcon,
        createdAt: new Date(0),
      },
    ];

    if (!convexFolders) return staticFolders;

    const dynamicFolders = convexFolders.map((f) => ({
      id: f._id,
      name: f.name,
      count: 0,
      createdAt: new Date(f.createdAt),
    }));

    const allFolders = [...staticFolders, ...dynamicFolders];

    if (convexBookmarks) {
      const counts: Record<string, number> = {};
      convexBookmarks.forEach((b) => {
        counts[FOLDER_ID_ALL] = (counts[FOLDER_ID_ALL] || 0) + 1;
        if (b.folderId) {
          counts[b.folderId] = (counts[b.folderId] || 0) + 1;
        }
      });

      return allFolders.map((f) => ({
        ...f,
        count: counts[f.id] || 0,
      }));
    }

    return allFolders;
  }, [convexFolders, convexBookmarks]);

  const folderNameById = useMemo(
    () =>
      folders.reduce<Record<string, string>>(
        (acc, folder) => {
          acc[folder.id] = folder.name;
          return acc;
        },
        { [FOLDER_ID_ALL]: "All Bookmarks" },
      ),
    [folders],
  );

  const editableFolders = useMemo(
    () => folders.filter((f) => f.id !== FOLDER_ID_ALL),
    [folders],
  );

  const folderViewItems: FolderViewItem[] = useMemo(() => {
    const bookmarksByFolder = new Map<string, Bookmark[]>();
    for (const bookmark of bookmarks) {
      const folderBookmarks = bookmarksByFolder.get(bookmark.folderId) ?? [];
      folderBookmarks.push(bookmark);
      bookmarksByFolder.set(bookmark.folderId, folderBookmarks);
    }

    return editableFolders.map((folder) => {
      const folderBookmarks = bookmarksByFolder.get(folder.id) ?? [];
      const byNewest = [...folderBookmarks].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
      const latestBookmarkCreatedAt = byNewest[0]?.createdAt;
      const previewBookmark = byNewest.find(
        (bookmark) =>
          Boolean(bookmark.ogImage) && bookmark.ogImage?.startsWith("http"),
      );

      return {
        ...folder,
        latestBookmarkCreatedAt,
        latestBookmarkUrl: previewBookmark?.url,
        previewImage: previewBookmark?.ogImage,
      };
    });
  }, [bookmarks, editableFolders]);

  return {
    bookmarks,
    folders,
    folderNameById,
    editableFolders,
    folderViewItems,
    isLoading,
  };
}
