"use client";

import { useMemo } from "react";
import type { Bookmark, FolderViewItem } from "@/components/bookmarks/types";
import {
  filterBookmarksBySearch,
  filterFoldersBySearch,
  sortBookmarksByDate,
} from "@/lib/bookmarks-utils";
import type { SortMode } from "./use-general-store";

interface UseBookmarksFiltersArgs {
  bookmarks: Bookmark[];
  folderViewItems: FolderViewItem[];
  selectedFolder: string;
  searchQuery: string;
  sortMode: SortMode;
}

export function useBookmarksFilters({
  bookmarks,
  folderViewItems,
  selectedFolder,
  searchQuery,
  sortMode,
}: UseBookmarksFiltersArgs) {
  const filteredBookmarks = useMemo(() => {
    let result = bookmarks;
    if (selectedFolder !== "all") {
      result = bookmarks.filter((b) => b.folderId === selectedFolder);
    }
    return filterBookmarksBySearch(result, searchQuery);
  }, [bookmarks, selectedFolder, searchQuery]);

  const sortedFilteredBookmarks = useMemo(
    () => sortBookmarksByDate(filteredBookmarks, sortMode),
    [filteredBookmarks, sortMode],
  );

  const effectiveFilteredBookmarks = sortedFilteredBookmarks;

  const filteredFolders = useMemo(
    () => filterFoldersBySearch(folderViewItems, searchQuery),
    [folderViewItems, searchQuery],
  );

  const sortedFilteredFolders = useMemo(
    () =>
      sortBookmarksByDate(
        filteredFolders.map((folder) => ({
          ...folder,
          createdAt: folder.latestBookmarkCreatedAt ?? folder.createdAt,
        })),
        sortMode,
      ),
    [filteredFolders, sortMode],
  );

  return {
    filteredBookmarks,
    sortedFilteredBookmarks,
    effectiveFilteredBookmarks,
    filteredFolders,
    sortedFilteredFolders,
  };
}
