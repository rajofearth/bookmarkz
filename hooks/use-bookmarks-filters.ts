"use client";

import { useAction } from "convex/react";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import type { Bookmark } from "@/components/bookmarks/types";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useGeneralStore } from "@/hooks/use-general-store";
import {
  filterBookmarksBySearch,
  sortBookmarksByDate,
} from "@/lib/bookmarks-utils";
import {
  embedBookmarkQuery,
  warmupEmbeddingModel,
} from "@/lib/embedding-client";
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
  const latestRequestRef = useRef(0);
  const lastInputAtRef = useRef(0);
  const semanticResultCacheRef = useRef(new Map<string, string[]>());
  const semanticInFlightRef = useRef(new Map<string, Promise<string[]>>());

  useEffect(() => {
    lastInputAtRef.current = performance.now();
    if (process.env.NODE_ENV !== "production") {
      const rafId = window.requestAnimationFrame(() => {
        const elapsed = Math.round(performance.now() - lastInputAtRef.current);
        console.debug("[semantic-search] lexical-ready-ms", elapsed);
      });
      window.setTimeout(() => window.cancelAnimationFrame(rafId), 500);
    }
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    if (!semanticSearchEnabled) {
      return;
    }
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let cancelled = false;
    let idleId: number | null = null;
    const warm = () => {
      if (cancelled) {
        return;
      }
      void warmupEmbeddingModel(semanticDtype).catch((error) => {
        console.warn("Semantic model warm-up failed", error);
      });
    };

    if (typeof win.requestIdleCallback === "function") {
      idleId = win.requestIdleCallback(warm);
    } else {
      const timeoutId = window.setTimeout(warm, 50);
      idleId = timeoutId;
    }
    return () => {
      cancelled = true;
      if (idleId === null) {
        return;
      }
      if (typeof win.cancelIdleCallback === "function") {
        win.cancelIdleCallback(idleId);
      } else {
        window.clearTimeout(idleId);
      }
    };
  }, [semanticDtype, semanticSearchEnabled]);

  useEffect(() => {
    const hasQuery = debouncedQuery.length > 0;
    if (!hasQuery || !semanticSearchEnabled) {
      setSemanticIds(null);
      return;
    }

    const semanticKey = `${semanticDtype}|${isMobile ? "mobile" : selectedFolder}|${debouncedQuery
      .trim()
      .toLowerCase()}`;
    const cachedIds = semanticResultCacheRef.current.get(semanticKey);
    if (cachedIds) {
      startTransition(() => {
        setSemanticIds(cachedIds);
      });
      return;
    }
    setSemanticIds(null);

    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;
    let cancelled = false;
    const startedAt = lastInputAtRef.current || performance.now();
    (async () => {
      try {
        let pending = semanticInFlightRef.current.get(semanticKey);
        if (!pending) {
          pending = (async () => {
            const { vector } = await embedBookmarkQuery(
              debouncedQuery,
              semanticDtype,
            );
            const results = await semanticSearch({
              queryEmbedding: vector,
              limit: 40,
              selectedFolder:
                !isMobile && selectedFolder !== "all"
                  ? (selectedFolder as Id<"folders">)
                  : undefined,
              minScore: 0.2,
            });
            return results.map((entry) => entry.bookmark._id);
          })();
          semanticInFlightRef.current.set(semanticKey, pending);
        }

        const nextIds = await pending;
        semanticInFlightRef.current.delete(semanticKey);
        if (cancelled || latestRequestRef.current !== requestId) {
          return;
        }
        if (process.env.NODE_ENV !== "production") {
          const elapsed = Math.round(performance.now() - startedAt);
          console.debug("[semantic-search] rerank-ready-ms", elapsed);
        }
        semanticResultCacheRef.current.set(semanticKey, nextIds);
        if (semanticResultCacheRef.current.size > 64) {
          const oldestKey = semanticResultCacheRef.current.keys().next()
            .value as string | undefined;
          if (oldestKey) {
            semanticResultCacheRef.current.delete(oldestKey);
          }
        }
        startTransition(() => {
          setSemanticIds(nextIds);
        });
      } catch (error) {
        semanticInFlightRef.current.delete(semanticKey);
        if (!cancelled && latestRequestRef.current === requestId) {
          console.error("Semantic search failed", error);
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
