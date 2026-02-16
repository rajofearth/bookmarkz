"use client";

import { useAction } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import type { Bookmark } from "@/components/bookmarks/types";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useGeneralStore } from "@/hooks/use-general-store";
import {
  filterBookmarksBySearch,
  sortBookmarksByDate,
} from "@/lib/bookmarks-utils";
import { embedBookmarkQuery } from "@/lib/embedding-client";
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
  const semanticSearch = useAction(api.actions.semanticSearchBookmarks);
  const semanticSearchEnabled = useGeneralStore(
    (state) => state.semanticSearchEnabled,
  );
  const semanticDtype = useGeneralStore((state) => state.semanticDtype);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery.trim());
  const [semanticIds, setSemanticIds] = useState<string[] | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    const hasQuery = debouncedQuery.length > 0;
    if (!hasQuery || !semanticSearchEnabled) {
      setSemanticIds(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { vector } = await embedBookmarkQuery(
          debouncedQuery,
          semanticDtype,
        );
        const results = await semanticSearch({
          queryEmbedding: vector,
          limit: 50,
          selectedFolder:
            !isMobile && selectedFolder !== "all"
              ? (selectedFolder as Id<"folders">)
              : undefined,
          minScore: 0.15,
        });
        if (cancelled) {
          return;
        }
        setSemanticIds(results.map((entry) => entry.bookmark._id));
      } catch (error) {
        if (!cancelled) {
          console.error("Semantic search failed", error);
          setSemanticIds(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    debouncedQuery,
    isMobile,
    selectedFolder,
    semanticDtype,
    semanticSearch,
    semanticSearchEnabled,
  ]);

  const folderFilteredBookmarks = useMemo(() => {
    if (selectedFolder === "all" || isMobile) {
      return bookmarks;
    }
    return bookmarks.filter((bookmark) => bookmark.folderId === selectedFolder);
  }, [bookmarks, isMobile, selectedFolder]);

  const lexicalFilteredBookmarks = useMemo(
    () => filterBookmarksBySearch(folderFilteredBookmarks, searchQuery),
    [folderFilteredBookmarks, searchQuery],
  );

  const filteredBookmarks = useMemo(() => {
    if (!searchQuery.trim() || !semanticIds || semanticIds.length === 0) {
      return lexicalFilteredBookmarks;
    }
    const byId = new Map(
      folderFilteredBookmarks.map((bookmark) => [bookmark.id, bookmark]),
    );
    const semanticOrdered = semanticIds
      .map((id) => byId.get(id))
      .filter((bookmark): bookmark is Bookmark => Boolean(bookmark));

    if (semanticOrdered.length === 0) {
      return lexicalFilteredBookmarks;
    }

    const semanticSet = new Set(semanticOrdered.map((bookmark) => bookmark.id));
    const lexicalRemainder = lexicalFilteredBookmarks.filter(
      (bookmark) => !semanticSet.has(bookmark.id),
    );
    return [...semanticOrdered, ...lexicalRemainder];
  }, [
    folderFilteredBookmarks,
    lexicalFilteredBookmarks,
    searchQuery,
    semanticIds,
  ]);

  const isSemanticRankedSearch = useMemo(() => {
    return (
      semanticSearchEnabled &&
      searchQuery.trim().length > 0 &&
      semanticIds !== null &&
      semanticIds.length > 0
    );
  }, [searchQuery, semanticIds, semanticSearchEnabled]);

  const sortedFilteredBookmarks = useMemo(() => {
    if (isSemanticRankedSearch) {
      // Preserve semantic relevance ranking returned by vector search.
      return filteredBookmarks;
    }
    return sortBookmarksByDate(filteredBookmarks, sortMode);
  }, [filteredBookmarks, isSemanticRankedSearch, sortMode]);

  const effectiveFilteredBookmarks = useMemo(() => {
    return sortedFilteredBookmarks;
  }, [sortedFilteredBookmarks]);

  return {
    filteredBookmarks,
    sortedFilteredBookmarks,
    effectiveFilteredBookmarks,
  };
}
