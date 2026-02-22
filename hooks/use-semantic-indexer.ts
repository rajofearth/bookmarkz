"use client";

import { useMutation } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useGeneralStore } from "@/hooks/use-general-store";
import { embedBookmarkDocument } from "@/lib/embedding-client";
import {
  buildBookmarkEmbeddingText,
  EMBEDDING_DIM,
  EMBEDDING_MODEL_ID,
  hashSemanticText,
} from "@/lib/semantic-search";

const HASH_CACHE_KEY = "bookmark_semantic_hashes_v1";

type BookmarkForIndex = {
  id: string;
  title: string;
  url: string;
  description?: string;
};

function getHashCache() {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(HASH_CACHE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function setHashCache(cache: Record<string, string>) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(HASH_CACHE_KEY, JSON.stringify(cache));
}

export function useSemanticIndexer() {
  const upsertEmbedding = useMutation(api.bookmarks.upsertBookmarkEmbedding);
  const deleteEmbedding = useMutation(api.bookmarks.deleteBookmarkEmbedding);
  const semanticDtype = useGeneralStore((state) => state.semanticDtype);
  const autoIndexing = useGeneralStore((state) => state.semanticAutoIndexing);
  const semanticSearchEnabled = useGeneralStore(
    (state) => state.semanticSearchEnabled,
  );

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  const queueRef = useRef<BookmarkForIndex[]>([]);
  const forceRef = useRef(false);
  const runningRef = useRef(false);
  const pausedRef = useRef(false);
  const semanticEnabledRef = useRef(semanticSearchEnabled);

  useEffect(() => {
    semanticEnabledRef.current = semanticSearchEnabled;
    if (semanticSearchEnabled) {
      return;
    }
    queueRef.current = [];
    pausedRef.current = false;
    runningRef.current = false;
    setIsRunning(false);
    setIsPaused(false);
    setProcessedCount(0);
    setTotalCount(0);
  }, [semanticSearchEnabled]);

  const indexBookmark = useCallback(
    async (bookmark: BookmarkForIndex, force = false) => {
      if (!semanticEnabledRef.current) {
        return { skipped: true };
      }
      const text = buildBookmarkEmbeddingText(bookmark);
      const contentHash = hashSemanticText(text);
      if (!force) {
        const hashCache = getHashCache();
        if (hashCache[bookmark.id] === contentHash) {
          return { skipped: true };
        }
      }

      const { vector, dtype } = await embedBookmarkDocument(
        text,
        semanticDtype,
      );
      await upsertEmbedding({
        bookmarkId: bookmark.id as Id<"bookmarks">,
        embedding: vector,
        embeddingDim: EMBEDDING_DIM,
        embeddingModel: EMBEDDING_MODEL_ID,
        embeddingDtype: dtype,
        contentHash,
      });

      const hashCache = getHashCache();
      hashCache[bookmark.id] = contentHash;
      setHashCache(hashCache);
      return { skipped: false };
    },
    [semanticDtype, upsertEmbedding],
  );

  const runQueue = useCallback(async () => {
    if (runningRef.current) {
      return;
    }
    runningRef.current = true;
    setIsRunning(true);
    pausedRef.current = false;
    setIsPaused(false);

    while (queueRef.current.length > 0) {
      if (!semanticEnabledRef.current) {
        queueRef.current = [];
        break;
      }
      if (pausedRef.current) {
        break;
      }
      const next = queueRef.current.shift();
      if (!next) {
        continue;
      }
      try {
        await indexBookmark(next, forceRef.current);
      } catch (error) {
        setErrorCount((value) => value + 1);
        console.error("Semantic index failed for bookmark", next.id, error);
      } finally {
        setProcessedCount((value) => value + 1);
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    runningRef.current = false;
    setIsRunning(false);
  }, [indexBookmark]);

  const startBackfill = useCallback(
    (bookmarks: BookmarkForIndex[], force = false) => {
      if (!semanticEnabledRef.current) {
        queueRef.current = [];
        setProcessedCount(0);
        setTotalCount(0);
        setIsPaused(false);
        setIsRunning(false);
        return;
      }
      if (bookmarks.length === 0) {
        setProcessedCount(0);
        setTotalCount(0);
        return;
      }
      forceRef.current = force;
      queueRef.current = [...bookmarks];
      setProcessedCount(0);
      setErrorCount(0);
      setTotalCount(bookmarks.length);
      void runQueue();
    },
    [runQueue],
  );

  const pauseBackfill = useCallback(() => {
    pausedRef.current = true;
    setIsPaused(true);
  }, []);

  const resumeBackfill = useCallback(() => {
    if (!semanticEnabledRef.current) {
      return;
    }
    if (queueRef.current.length === 0) {
      return;
    }
    pausedRef.current = false;
    setIsPaused(false);
    void runQueue();
  }, [runQueue]);

  const clearBookmarkHash = useCallback(
    async (bookmarkId: string) => {
      await deleteEmbedding({ bookmarkId: bookmarkId as Id<"bookmarks"> });
      const hashCache = getHashCache();
      delete hashCache[bookmarkId];
      setHashCache(hashCache);
    },
    [deleteEmbedding],
  );

  return useMemo(
    () => ({
      semanticDtype,
      autoIndexing,
      semanticSearchEnabled,
      isRunning,
      isPaused,
      processedCount,
      totalCount,
      errorCount,
      indexBookmark,
      startBackfill,
      pauseBackfill,
      resumeBackfill,
      clearBookmarkHash,
    }),
    [
      semanticDtype,
      autoIndexing,
      semanticSearchEnabled,
      isRunning,
      isPaused,
      processedCount,
      totalCount,
      errorCount,
      indexBookmark,
      startBackfill,
      pauseBackfill,
      resumeBackfill,
      clearBookmarkHash,
    ],
  );
}
