"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2 } from "lucide-react";

export function MetadataFetcher() {
    const bookmarks = useQuery(api.bookmarks.getBookmarks);
    const updateMetadata = useMutation(api.bookmarks.updateBookmarkMetadata);
    const fetchMetadataAction = useAction(api.actions.fetchMetadata);

    const [processing, setProcessing] = useState<Set<string>>(new Set());
    const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

    useEffect(() => {
        if (!bookmarks) return;

        const pendingBookmarks = bookmarks.filter(
            (b) => b.metadataStatus === "pending" && !processing.has(b._id)
        );

        if (pendingBookmarks.length === 0) {
            if (processing.size === 0) {
                setProgress(null);
            }
            return;
        }

        const processQueue = async () => {
            // Initialize progress
            const total = pendingBookmarks.length + processing.size;
            setProgress((prev) => ({
                current: prev ? prev.current : 0,
                total: total
            }));

            // Add to processing set
            setProcessing((prev) => {
                const next = new Set(prev);
                pendingBookmarks.forEach((b) => next.add(b._id));
                return next;
            });

            // Process in chunks of 5
            const CONCURRENCY = 5;
            for (let i = 0; i < pendingBookmarks.length; i += CONCURRENCY) {
                const chunk = pendingBookmarks.slice(i, i + CONCURRENCY);

                await Promise.all(
                    chunk.map(async (bookmark) => {
                        try {
                            const metadata = await fetchMetadataAction({ url: bookmark.url });

                            await updateMetadata({
                                bookmarkId: bookmark._id,
                                title: metadata.title,
                                favicon: metadata.favicon,
                                ogImage: metadata.ogImage,
                            });
                        } catch (error) {
                            console.error(`Failed to process ${bookmark.url}`, error);
                            // Mark as failed locally so we don't retry immediately? 
                            // For now, we just leave it or maybe a robust retry logic is needed later.
                            // But to stop infinite loop, we should probably mark it as failed in DB.
                            // However, for this MVP, if action fails it returns partial data or error, 
                            // and we call updateMetadata anyway which sets status to "completed".
                        } finally {
                            setProcessing((prev) => {
                                const next = new Set(prev);
                                next.delete(bookmark._id);
                                return next;
                            });
                            setProgress((prev) => prev ? { ...prev, current: prev.current + 1 } : null);
                        }
                    })
                );
            }
        };

        processQueue();
    }, [bookmarks, fetchMetadataAction, updateMetadata]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!progress || progress.total === 0 || progress.current >= progress.total) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-card p-4 shadow-lg border border-border flex items-center gap-3 animate-in slide-in-from-bottom-5">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Enriching bookmarks...</p>
                <p className="text-xs text-muted-foreground">
                    {progress.current} / {progress.total} processed
                </p>
            </div>
        </div>
    );
}
