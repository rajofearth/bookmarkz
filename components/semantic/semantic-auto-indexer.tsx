"use client";

import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import { useGeneralStore } from "@/hooks/use-general-store";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSemanticIndexer } from "@/hooks/use-semantic-indexer";

const RETRY_COOLDOWN_MS = 15000;
const SUCCESS_RECHECK_DELAY_MS = 1500;

export function SemanticAutoIndexer() {
  const profile = useQuery(api.users.getProfile);
  const bookmarks = useQuery(api.bookmarks.getBookmarks);
  const embeddingStats = useQuery(api.bookmarks.getEmbeddingIndexStats);
  const isMobile = useIsMobile();

  const semanticAutoIndexing = useGeneralStore(
    (state) => state.semanticAutoIndexing,
  );
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
    startBackfill,
    pauseBackfill,
    resumeBackfill,
    stopBackfill,
  } = useSemanticIndexer();

  const pendingCount = embeddingStats?.pendingBookmarks ?? 0;
  const staleCount = embeddingStats?.staleBookmarks ?? 0;
  const backlogCount = pendingCount + staleCount;
  const isAuthenticated = profile !== null && profile !== undefined;

  const canAutoRun =
    isAuthenticated &&
    semanticSearchEnabled &&
    semanticAutoIndexing &&
    backlogCount > 0;

  const indexPayload = useMemo(
    () =>
      (bookmarks ?? []).map((bookmark) => ({
        id: bookmark._id,
        title: bookmark.title,
        url: bookmark.url,
        description: bookmark.description,
      })),
    [bookmarks],
  );

  const autoPausedRef = useRef(false);
  const prevRunningRef = useRef(false);
  const runStartProcessedRef = useRef<number>(0);
  const nextRetryAtRef = useRef(0);

  // Stop only background runs when auto-indexing or semantic search is disabled.
  useEffect(() => {
    if (semanticAutoIndexing && semanticSearchEnabled) {
      return;
    }
    if (isRunning && activeMode === "background") {
      stopBackfill();
    }
  }, [
    semanticAutoIndexing,
    semanticSearchEnabled,
    isRunning,
    activeMode,
    stopBackfill,
  ]);

  // Track run completion so background retries don't spin on errors.
  useEffect(() => {
    const wasRunning = prevRunningRef.current;
    if (!wasRunning && isRunning) {
      runStartProcessedRef.current = processedCount;
    }
    if (wasRunning && !isRunning) {
      const processedDelta = Math.max(
        processedCount - runStartProcessedRef.current,
        0,
      );
      nextRetryAtRef.current =
        Date.now() +
        (processedDelta === 0 ? RETRY_COOLDOWN_MS : SUCCESS_RECHECK_DELAY_MS);
    }
    prevRunningRef.current = isRunning;
  }, [isRunning, processedCount]);

  // Gentle auto-run orchestration.
  useEffect(() => {
    if (!canAutoRun) {
      return;
    }
    if (isRunning || isPaused) {
      return;
    }
    if (indexPayload.length === 0) {
      return;
    }
    if (Date.now() < nextRetryAtRef.current) {
      return;
    }
    startBackfill(indexPayload, false, {
      mode: "background",
    });
  }, [canAutoRun, isRunning, isPaused, indexPayload, startBackfill]);

  // Pause on hidden/offline and resume only if this component auto-paused.
  useEffect(() => {
    const shouldPause = () =>
      document.visibilityState !== "visible" || !navigator.onLine;

    const tryPause = () => {
      if (
        isRunning &&
        !isPaused &&
        activeMode === "background" &&
        shouldPause()
      ) {
        autoPausedRef.current = true;
        pauseBackfill();
      }
    };

    const tryResume = () => {
      if (!autoPausedRef.current) {
        return;
      }
      if (!canAutoRun || !isPaused || activeMode !== "background") {
        return;
      }
      if (document.visibilityState === "visible" && navigator.onLine) {
        autoPausedRef.current = false;
        resumeBackfill();
      }
    };

    document.addEventListener("visibilitychange", tryPause);
    document.addEventListener("visibilitychange", tryResume);
    window.addEventListener("offline", tryPause);
    window.addEventListener("online", tryResume);
    tryPause();
    tryResume();

    return () => {
      document.removeEventListener("visibilitychange", tryPause);
      document.removeEventListener("visibilitychange", tryResume);
      window.removeEventListener("offline", tryPause);
      window.removeEventListener("online", tryResume);
    };
  }, [
    canAutoRun,
    isRunning,
    isPaused,
    activeMode,
    pauseBackfill,
    resumeBackfill,
  ]);

  if (!isRunning || isPaused) {
    return null;
  }

  const progressLabel =
    totalCount > 0
      ? `${Math.min(processedCount, totalCount)} / ${totalCount}`
      : "Preparing…";
  const pendingStaleLabel = `${pendingCount} pending · ${staleCount} stale`;
  const errorLabel = errorCount > 0 ? ` · ${errorCount} failed` : "";
  const summary = `${progressLabel} · ${pendingStaleLabel}${errorLabel}`;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 hidden md:block">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Indexing bookmarks in background"
              className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm"
            >
              <Loader2 className="size-3.5 animate-spin" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-[11px]">
            <div className="space-y-0.5">
              <p>Indexing bookmarks</p>
              <p className="text-background/80">{summary}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="fixed right-3 z-50 md:hidden bottom-[calc(4.75rem+env(safe-area-inset-bottom))]">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Show indexing status"
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 text-[11px] text-muted-foreground shadow-sm"
            >
              <Loader2 className="size-3 animate-spin" />
              <span>{isMobile ? "Indexing" : "Syncing"}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" side="top" className="w-56 p-3">
            <p className="text-xs font-medium">Indexing bookmarks</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {progressLabel}
            </p>
            <p className="text-xs text-muted-foreground">{pendingStaleLabel}</p>
            {errorCount > 0 ? (
              <p className="text-xs text-destructive">Failed: {errorCount}</p>
            ) : null}
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}
