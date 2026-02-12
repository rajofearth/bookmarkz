"use client";

import { useMemo } from "react";
import type { Bookmark } from "@/components/bookmarks/types";
import {
  filterBookmarksBySearch,
  sortBookmarksByDate,
} from "@/lib/bookmarks-utils";
import type { SortMode } from "./use-general-store";

interface UseBookmarksFiltersArgs {
  bookmarks: Bookmark[];
  selectedFolder: string;
  searchQuery: string;
  sortMode: SortMode;
  isMobile: boolean;
}

export function useBookmarksFilters({
  bookmarks,
  selectedFolder,
  searchQuery,
  sortMode,
  isMobile,
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

  const effectiveFilteredBookmarks = useMemo(() => {
    if (isMobile) {
      const filtered = filterBookmarksBySearch(bookmarks, searchQuery);
      return sortBookmarksByDate(filtered, sortMode);
    }
    return sortedFilteredBookmarks;
  }, [isMobile, bookmarks, searchQuery, sortedFilteredBookmarks, sortMode]);

  return {
    filteredBookmarks,
    sortedFilteredBookmarks,
    effectiveFilteredBookmarks,
  };
}
