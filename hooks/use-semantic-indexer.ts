"use client";

import { useConvex, useMutation } from "convex/react";
import { useCallback, useEffect, useMemo } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useGeneralStore } from "@/hooks/use-general-store";
import {
  type IndexerRunMode,
  type ModelLoadingStage,
  useSemanticIndexerStore,
} from "@/hooks/use-semantic-indexer-store";
import { embedBookmarkDocument } from "@/lib/embedding-client";
import { loadEmbeddingBundle } from "@/lib/embedding-runtime";
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

type StartBackfillOptions = {
  mode?: IndexerRunMode;
  itemDelayMs?: number;
};

const DEFAULT_BACKGROUND_DELAY_MS = 80;

const runtime = {
  queue: [] as BookmarkForIndex[],
  force: false,
  running: false,
  paused: false,
  semanticEnabled: true,
  itemDelayMs: 0,
  mode: "manual" as IndexerRunMode,
};

const modelTracking = {
  fileLoaded: {} as Record<string, number>,
  aggLastLoaded: 0,
  aggLastTime: 0,
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
  const convex = useConvex();
  const upsertEmbedding = useMutation(api.bookmarks.upsertBookmarkEmbedding);
  const deleteEmbedding = useMutation(api.bookmarks.deleteBookmarkEmbedding);
  const semanticDtype = useGeneralStore((state) => state.semanticDtype);
  const autoIndexing = useGeneralStore((state) => state.semanticAutoIndexing);
  const semanticSearchEnabled = useGeneralStore(
    (state) => state.semanticSearchEnabled,
  );

  const {
    isRunning,
    isPaused,
    activeMode,
    processedCount,
    totalCount,
    errorCount,
    setRunning,
    setPaused,
    setActiveMode,
    setProcessedCount,
    setTotalCount,
    setErrorCount,
    setModelReady,
    setModelLoadingStage,
    setModelLoadingProgress,
    setModelLoadingSpeedBytesPerSec,
    setModelLoadingDtype,
    setFileProgress,
    setError,
    resetModelState,
    resetProgress,
  } = useSemanticIndexerStore();

  useEffect(() => {
    runtime.semanticEnabled = semanticSearchEnabled;
    if (semanticSearchEnabled) {
      return;
    }
    runtime.queue = [];
    runtime.paused = false;
    runtime.running = false;
    setRunning(false);
    setPaused(false);
    setActiveMode(null);
    resetProgress();
  }, [
    semanticSearchEnabled,
    setRunning,
    setPaused,
    setActiveMode,
    resetProgress,
  ]);

  // ── Model loading progress callback ─────────────────────────────────
  // Used ONLY during the single model-load call at the start of a run
  const createModelProgressCallback = useCallback(() => {
    // Reset aggregate tracking for a fresh model load
    modelTracking.fileLoaded = {};
    modelTracking.aggLastLoaded = 0;
    modelTracking.aggLastTime = 0;

    return (info: {
      status?: string;
      progress?: number;
      file?: string;
      loaded?: number;
      total?: number;
    }) => {
      // Map TransformersJS status to our stages
      // "done" fires per-file (more files may still be downloading)
      // "ready" fires once when the entire pipeline is fully loaded
      const stage: ModelLoadingStage =
        info.status === "initiate"
          ? "initiate"
          : info.status === "download"
            ? "download"
            : info.status === "progress"
              ? "progress"
              : info.status === "loading"
                ? "loading"
                : info.status === "ready"
                  ? "done"
                  : info.status === "done"
                    ? "progress"
                    : // per-file done
                      "progress";
      setModelLoadingStage(stage);
      setModelLoadingDtype(semanticDtype);

      if (typeof info.progress === "number") {
        setModelLoadingProgress(info.progress);
      }

      // Per-file progress → store so UI can aggregate
      const file = info.file;
      const loaded = info.loaded ?? 0;
      const total = info.total ?? 0;
      if (
        file &&
        typeof info.loaded === "number" &&
        typeof info.total === "number" &&
        total > 0
      ) {
        setFileProgress(file, loaded, total);
        modelTracking.fileLoaded[file] = loaded;
      }

      // Aggregate speed across all files
      const aggLoaded = Object.values(modelTracking.fileLoaded).reduce(
        (s: number, v: number) => s + v,
        0,
      );
      const now = performance.now() / 1000;
      if (
        modelTracking.aggLastTime > 0 &&
        aggLoaded > modelTracking.aggLastLoaded &&
        now > modelTracking.aggLastTime
      ) {
        const elapsed = now - modelTracking.aggLastTime;
        const delta = aggLoaded - modelTracking.aggLastLoaded;
        if (delta > 0 && elapsed > 0.1) {
          setModelLoadingSpeedBytesPerSec(delta / elapsed);
        }
      }
      modelTracking.aggLastLoaded = aggLoaded;
      modelTracking.aggLastTime = now;
    };
  }, [
    semanticDtype,
    setModelLoadingStage,
    setModelLoadingProgress,
    setModelLoadingDtype,
    setFileProgress,
    setModelLoadingSpeedBytesPerSec,
  ]);

  // ── Embed a single bookmark (model already loaded) ──────────────────
  const indexBookmark = useCallback(
    async (bookmark: BookmarkForIndex, force = false) => {
      if (!runtime.semanticEnabled) {
        return { skipped: true };
      }
      const text = buildBookmarkEmbeddingText(bookmark);
      const contentHash = hashSemanticText(text);
      if (!force) {
        const hashCache = getHashCache();
        if (hashCache[bookmark.id] === contentHash) {
          return { skipped: true };
        }
        try {
          const serverHash = await convex.query(
            api.bookmarks.getBookmarkEmbeddingHash,
            { bookmarkId: bookmark.id as Id<"bookmarks"> },
          );
          if (serverHash === contentHash) {
            hashCache[bookmark.id] = contentHash;
            setHashCache(hashCache);
            return { skipped: true };
          }
        } catch (error) {
          console.debug(
            "Semantic index server hash precheck failed; continuing to embed",
            error,
          );
        }
      }

      // No progressCallback — model is already loaded, this just runs inference
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
    [convex, semanticDtype, upsertEmbedding],
  );

  // ── Queue runner ─────────────────────────────────────────────────────
  const runQueue = useCallback(async () => {
    if (runtime.running) {
      return;
    }
    runtime.running = true;
    setRunning(true);
    runtime.paused = false;
    setPaused(false);
    setActiveMode(runtime.mode);
    setError(null);

    // ── Phase 1: Load model ONCE ────────────────────────────────────
    // Don't eagerly set "initiate" — let progress callbacks drive stage.
    // If model is already in memory, no callbacks fire → modelReady is
    // set immediately and UI skips straight to indexing.
    resetModelState();

    try {
      const progressCb = createModelProgressCallback();
      await loadEmbeddingBundle(semanticDtype, progressCb);
      setModelReady(true);
      setModelLoadingStage("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load model";
      setError(msg);
      runtime.running = false;
      setRunning(false);
      setActiveMode(null);
      return;
    }

    // ── Phase 2: Index bookmarks ────────────────────────────────────
    while (runtime.queue.length > 0) {
      if (!runtime.semanticEnabled) {
        runtime.queue = [];
        break;
      }
      if (runtime.paused) {
        runtime.running = false;
        break;
      }
      const next = runtime.queue.shift();
      if (!next) {
        continue;
      }
      try {
        await indexBookmark(next, runtime.force);
      } catch (error) {
        setErrorCount((value) => value + 1);
        console.error("Semantic index failed for bookmark", next.id, error);
      } finally {
        setProcessedCount((prev) => prev + 1);
      }
      await new Promise((resolve) =>
        setTimeout(resolve, Math.max(runtime.itemDelayMs, 0)),
      );
    }

    if (!runtime.paused) {
      runtime.running = false;
      setRunning(false);
      setActiveMode(null);
    }
  }, [
    indexBookmark,
    createModelProgressCallback,
    semanticDtype,
    setRunning,
    setPaused,
    setProcessedCount,
    setErrorCount,
    setModelReady,
    setModelLoadingStage,
    setError,
    setActiveMode,
    resetModelState,
  ]);

  const startBackfill = useCallback(
    (
      bookmarks: BookmarkForIndex[],
      force = false,
      options?: StartBackfillOptions,
    ) => {
      if (!runtime.semanticEnabled) {
        runtime.queue = [];
        resetProgress();
        setPaused(false);
        setRunning(false);
        setActiveMode(null);
        return;
      }
      if (bookmarks.length === 0) {
        resetProgress();
        return;
      }
      const mode = options?.mode ?? "manual";
      const itemDelayMs =
        options?.itemDelayMs ??
        (mode === "background" ? DEFAULT_BACKGROUND_DELAY_MS : 0);
      runtime.mode = mode;
      runtime.itemDelayMs = Math.max(itemDelayMs, 0);
      runtime.force = force;
      runtime.queue = [...bookmarks];
      setProcessedCount(0);
      setErrorCount(0);
      setTotalCount(bookmarks.length);
      setActiveMode(mode);
      void runQueue();
    },
    [
      runQueue,
      resetProgress,
      setPaused,
      setRunning,
      setActiveMode,
      setProcessedCount,
      setErrorCount,
      setTotalCount,
    ],
  );

  const pauseBackfill = useCallback(() => {
    runtime.paused = true;
    setPaused(true);
  }, [setPaused]);

  /** Stops indexing entirely — clears the queue so the run ends. */
  const stopBackfill = useCallback(() => {
    runtime.queue = [];
    runtime.paused = true;
    runtime.running = false;
    setPaused(false);
    setRunning(false);
    setActiveMode(null);
    resetProgress();
  }, [setPaused, setRunning, setActiveMode, resetProgress]);

  const resumeBackfill = useCallback(() => {
    if (!runtime.semanticEnabled) {
      return;
    }
    if (runtime.queue.length === 0) {
      return;
    }
    runtime.paused = false;
    setPaused(false);
    void runQueue();
  }, [runQueue, setPaused]);

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
      activeMode,
      processedCount,
      totalCount,
      errorCount,
      indexBookmark,
      startBackfill,
      pauseBackfill,
      resumeBackfill,
      stopBackfill,
      clearBookmarkHash,
    }),
    [
      semanticDtype,
      autoIndexing,
      semanticSearchEnabled,
      isRunning,
      isPaused,
      activeMode,
      processedCount,
      totalCount,
      errorCount,
      indexBookmark,
      startBackfill,
      pauseBackfill,
      resumeBackfill,
      stopBackfill,
      clearBookmarkHash,
    ],
  );
}
