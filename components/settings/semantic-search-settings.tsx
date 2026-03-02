"use client";

import {
    Brain,
    Loader2,
    Pause,
    Play,
    RefreshCw,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useGeneralStore } from "@/hooks/use-general-store";
import { useSemanticIndexer } from "@/hooks/use-semantic-indexer";
import { useSemanticIndexerStore } from "@/hooks/use-semantic-indexer-store";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatBytes } from "@/lib/utils";

// ─── Stat Item ───────────────────────────────────────────────────────
function StatItem({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
                {label}
            </span>
            <span className="text-sm font-medium tabular-nums">{value}</span>
        </div>
    );
}

// ─── Progress Bar ────────────────────────────────────────────────────
function ProgressBar({
    value,
    indeterminate = false,
}: {
    value: number;
    indeterminate?: boolean;
}) {
    return (
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-muted">
            {indeterminate ? (
                <motion.div
                    className="h-full rounded-full bg-foreground/60"
                    animate={{ width: ["30%", "70%", "30%"] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                />
            ) : (
                <motion.div
                    className="h-full rounded-full bg-foreground/60"
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                />
            )}
        </div>
    );
}

// ─── Indexing Progress ───────────────────────────────────────────────
function IndexingProgress({
    modelLoadingStage,
    modelLoadingProgress,
    modelLoadingFile,
    modelLoadingDtype,
    modelLoadingLoaded,
    modelLoadingTotal,
    modelLoadingSpeedBytesPerSec,
    processedCount,
    totalCount,
    errorCount,
}: {
    modelLoadingStage: string;
    modelLoadingProgress: number;
    modelLoadingFile: string | null;
    modelLoadingDtype: string | null;
    modelLoadingLoaded: number;
    modelLoadingTotal: number;
    modelLoadingSpeedBytesPerSec: number;
    processedCount: number;
    totalCount: number;
    errorCount: number;
}) {
    const modelProgressRounded = Math.round(modelLoadingProgress);
    const indexProgress =
        totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;

    const isLoadingModel =
        modelLoadingStage !== "idle" && modelLoadingStage !== "done";

    if (isLoadingModel) {
        const hasBytes = modelLoadingLoaded > 0 && modelLoadingTotal > 0;
        const hasProgress = modelLoadingProgress > 0;
        const progressValue = hasProgress
            ? modelLoadingProgress
            : hasBytes
                ? (modelLoadingLoaded / modelLoadingTotal) * 100
                : 0;
        const isIndeterminate = !hasProgress && !hasBytes && modelLoadingStage === "loading";

        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between gap-1.5 text-xs text-muted-foreground">
                    {!hasProgress && !hasBytes && (
                        <Loader2 className="size-3 shrink-0 animate-spin" />
                    )}
                    <span className="min-w-0 flex-1">
                        {modelLoadingStage === "initiate"
                            ? "Preparing model…"
                            : modelLoadingStage === "download" ||
                                modelLoadingStage === "progress"
                                ? `Downloading ${modelLoadingFile ?? "model"}${modelLoadingDtype ? ` (${modelLoadingDtype})` : ""}…`
                                : "Loading model into memory…"}
                    </span>
                    {(hasProgress || hasBytes) && (
                        <span className="shrink-0 tabular-nums">
                            {hasProgress
                                ? `${modelProgressRounded}%`
                                : `${Math.round((modelLoadingLoaded / modelLoadingTotal) * 100)}%`}
                        </span>
                    )}
                </div>
                {hasBytes && (
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>
                            {formatBytes(modelLoadingLoaded)} /{" "}
                            {formatBytes(modelLoadingTotal)}
                        </span>
                        {modelLoadingSpeedBytesPerSec > 0 && (
                            <span className="tabular-nums">
                                · {formatBytes(modelLoadingSpeedBytesPerSec)}/s
                            </span>
                        )}
                    </div>
                )}
                {(hasBytes || hasProgress) ? (
                    <ProgressBar value={progressValue} />
                ) : isIndeterminate ? (
                    <ProgressBar value={0} indeterminate />
                ) : null}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                    Indexing {processedCount} / {totalCount}
                </span>
                <span className="tabular-nums">{indexProgress}%</span>
            </div>
            <ProgressBar value={indexProgress} />
            {errorCount > 0 && (
                <p className="text-xs text-destructive">Failed: {errorCount}</p>
            )}
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────
export function SemanticSearchSettings() {
    const embeddingStats = useQuery(api.bookmarks.getEmbeddingIndexStats);
    const bookmarks = useQuery(api.bookmarks.getBookmarks);

    const {
        updateSettings,
        semanticDtype,
        semanticAutoIndexing,
        semanticSearchEnabled,
    } = useGeneralStore();

    const {
        isRunning,
        isPaused,
        processedCount,
        totalCount,
        errorCount,
        startBackfill,
        pauseBackfill,
        resumeBackfill,
    } = useSemanticIndexer();

    const modelLoadingStage = useSemanticIndexerStore((s) => s.modelLoadingStage);
    const modelLoadingProgress = useSemanticIndexerStore((s) => s.modelLoadingProgress);
    const modelLoadingFile = useSemanticIndexerStore((s) => s.modelLoadingFile);
    const modelLoadingLoaded = useSemanticIndexerStore((s) => s.modelLoadingLoaded);
    const modelLoadingTotal = useSemanticIndexerStore((s) => s.modelLoadingTotal);
    const modelLoadingSpeedBytesPerSec = useSemanticIndexerStore(
        (s) => s.modelLoadingSpeedBytesPerSec,
    );
    const modelLoadingDtype = useSemanticIndexerStore((s) => s.modelLoadingDtype);

    const hasBookmarks = (bookmarks?.length ?? 0) > 0;
    const canIndex = semanticSearchEnabled && hasBookmarks;
    const isFullyIndexed =
        (embeddingStats?.indexedBookmarks ?? 0) ===
        (embeddingStats?.totalBookmarks ?? 0) &&
        (embeddingStats?.pendingBookmarks ?? 0) === 0 &&
        (embeddingStats?.totalBookmarks ?? 0) > 0;

    const toIndexPayload = useCallback(
        () =>
            (bookmarks ?? []).map((b) => ({
                id: b._id,
                title: b.title,
                url: b.url,
                description: b.description,
            })),
        [bookmarks],
    );

    const handleStart = useCallback(
        (force = false) => startBackfill(toIndexPayload(), force),
        [startBackfill, toIndexPayload],
    );

    const rowClass = "flex items-center justify-between gap-3 py-3";

    return (
        <div className="space-y-1">
            <h3 className="text-base font-medium">Semantic Search</h3>
            <p className="text-sm text-muted-foreground">
                Generate embeddings locally and store vectors in Convex.
            </p>

            <div className="pt-4 space-y-0">
                {/* Dtype */}
                <div className={rowClass}>
                    <div className="flex items-center gap-2">
                        <Brain className="size-4 text-muted-foreground shrink-0" />
                        <span className="text-sm">Runtime dtype</span>
                    </div>
                    <Select
                        value={semanticDtype}
                        onValueChange={(value) =>
                            updateSettings({ semanticDtype: value as "q4" | "q8" | "fp32" })
                        }
                    >
                        <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="q4">q4</SelectItem>
                            <SelectItem value="q8">q8</SelectItem>
                            <SelectItem value="fp32">fp32</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Separator />

                {/* Enabled toggle */}
                <div className={rowClass}>
                    <span className="text-sm">Semantic search enabled</span>
                    <Switch
                        checked={semanticSearchEnabled}
                        onCheckedChange={(checked) =>
                            updateSettings({ semanticSearchEnabled: checked })
                        }
                    />
                </div>

                <Separator />

                {/* Auto-index toggle */}
                <div className={rowClass}>
                    <span className="text-sm">Auto-index on add / edit</span>
                    <Switch
                        checked={semanticAutoIndexing}
                        onCheckedChange={(checked) =>
                            updateSettings({ semanticAutoIndexing: checked })
                        }
                    />
                </div>

                <Separator />

                {/* Stats row */}
                <div className="flex items-center gap-6 py-3">
                    <StatItem label="Indexed" value={embeddingStats?.indexedBookmarks ?? 0} />
                    <StatItem label="Pending" value={embeddingStats?.pendingBookmarks ?? 0} />
                    <StatItem label="Stale" value={embeddingStats?.staleBookmarks ?? 0} />
                    <StatItem label="Total" value={embeddingStats?.totalBookmarks ?? 0} />
                </div>

                {/* Progress (while running) */}
                {isRunning && !isPaused && (
                    <div className="pb-3">
                        <IndexingProgress
                            modelLoadingStage={modelLoadingStage}
                            modelLoadingProgress={modelLoadingProgress}
                            modelLoadingFile={modelLoadingFile}
                            modelLoadingDtype={modelLoadingDtype}
                            modelLoadingLoaded={modelLoadingLoaded}
                            modelLoadingTotal={modelLoadingTotal}
                            modelLoadingSpeedBytesPerSec={modelLoadingSpeedBytesPerSec}
                            processedCount={processedCount}
                            totalCount={totalCount}
                            errorCount={errorCount}
                        />
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 pt-1 pb-1">
                    {!isRunning && (
                        <button
                            type="button"
                            onClick={() => handleStart(false)}
                            disabled={!canIndex || isFullyIndexed}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Play className="size-3" />
                            Start
                        </button>
                    )}
                    {isRunning && !isPaused && (
                        <button
                            type="button"
                            onClick={pauseBackfill}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
                        >
                            <Pause className="size-3" />
                            Pause
                        </button>
                    )}
                    {isPaused && (
                        <button
                            type="button"
                            onClick={resumeBackfill}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
                        >
                            <Play className="size-3" />
                            Resume
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => handleStart(true)}
                        disabled={isRunning}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isRunning ? (
                            <Loader2 className="size-3 animate-spin" />
                        ) : (
                            <RefreshCw className="size-3" />
                        )}
                        Reindex all
                    </button>
                </div>
            </div>
        </div>
    );
}
