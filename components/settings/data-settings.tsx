"use client";

import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  BookmarkIcon,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  FolderIcon,
  Loader2,
  Upload,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  downloadBookmarkFile,
  generateBookmarkHtml,
} from "@/lib/bookmark-exporter";
import { parseBookmarkHtml } from "@/lib/bookmark-parser";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./section-header";

// ─── Import state machine ────────────────────────────────────────────
type ImportState =
  | { status: "idle" }
  | { status: "parsing"; fileName: string }
  | {
      status: "previewing";
      fileName: string;
      bookmarkCount: number;
      folderCount: number;
      raw: ReturnType<typeof parseBookmarkHtml>;
    }
  | { status: "importing"; fileName: string; imported: number; total: number }
  | { status: "done"; imported: number; folders: number }
  | { status: "error"; message: string };

type ExportState = "idle" | "exporting" | "done" | "error";

// ─── Component ───────────────────────────────────────────────────────
export function DataSettings() {
  const isMobile = useIsMobile();
  // Export
  const bookmarks = useQuery(api.bookmarks.getBookmarks);
  const folders = useQuery(api.bookmarks.getFolders);
  const [exportState, setExportState] = useState<ExportState>("idle");

  // Import
  const [importState, setImportState] = useState<ImportState>({
    status: "idle",
  });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchCreateBookmarks = useMutation(api.bookmarks.batchCreateBookmarks);
  const createFolder = useMutation(api.bookmarks.createFolder);

  // ── Export handler ───────────────────────────────────────────
  const handleExport = useCallback(() => {
    if (!bookmarks || !folders) return;
    setExportState("exporting");

    try {
      const exportFolders = folders.map((f) => ({
        _id: f._id,
        name: f.name,
        parentId: f.parentId,
        createdAt: f.createdAt,
      }));

      const exportBookmarks = bookmarks.map((b) => ({
        title: b.title,
        url: b.url,
        favicon: b.favicon,
        createdAt: b.createdAt,
        folderId: b.folderId,
      }));

      const html = generateBookmarkHtml(exportBookmarks, exportFolders);
      downloadBookmarkFile(html);
      setExportState("done");

      // Reset after a few seconds
      setTimeout(() => setExportState("idle"), 3000);
    } catch {
      setExportState("error");
      setTimeout(() => setExportState("idle"), 3000);
    }
  }, [bookmarks, folders]);

  // ── Import handlers ──────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".html") && !file.name.endsWith(".htm")) {
      setImportState({
        status: "error",
        message: "Please upload the HTML file you exported from your browser.",
      });
      return;
    }

    setImportState({ status: "parsing", fileName: file.name });

    try {
      const text = await file.text();
      const result = parseBookmarkHtml(text);

      if (result.errors.length > 0) {
        setImportState({ status: "error", message: result.errors[0] });
        return;
      }

      if (result.bookmarks.length === 0) {
        setImportState({
          status: "error",
          message: "No bookmarks found in this file.",
        });
        return;
      }

      setImportState({
        status: "previewing",
        fileName: file.name,
        bookmarkCount: result.bookmarks.length,
        folderCount: result.folders.length,
        raw: result,
      });
    } catch {
      setImportState({
        status: "error",
        message: "Couldn't read this file. Please try again.",
      });
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (importState.status !== "previewing") return;

    const { raw } = importState;
    const total = raw.bookmarks.length;

    setImportState({
      status: "importing",
      fileName: importState.fileName,
      imported: 0,
      total,
    });

    try {
      const folderMap = new Map<string, Id<"folders">>();
      for (const folderName of raw.folders) {
        const folderId = await createFolder({ name: folderName });
        folderMap.set(folderName, folderId);
      }

      const CHUNK_SIZE = 50;
      let imported = 0;

      for (let i = 0; i < raw.bookmarks.length; i += CHUNK_SIZE) {
        const chunk = raw.bookmarks.slice(i, i + CHUNK_SIZE);
        const bookmarksToCreate = chunk.map((b) => ({
          title: b.title,
          url: b.url,
          folderId: b.folder ? folderMap.get(b.folder) : undefined,
        }));

        await batchCreateBookmarks({ bookmarks: bookmarksToCreate });
        imported += chunk.length;

        setImportState({
          status: "importing",
          fileName: importState.fileName,
          imported,
          total,
        });
      }

      setImportState({
        status: "done",
        imported,
        folders: raw.folders.length,
      });
    } catch {
      setImportState({
        status: "error",
        message: "Something went wrong. Please try again.",
      });
    }
  }, [importState, batchCreateBookmarks, createFolder]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const isDataLoading = bookmarks === undefined || folders === undefined;

  return (
    <>
      <SectionHeader
        title="Data"
        description="Import and export your bookmarks."
        compact={isMobile}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="max-w-2xl"
      >
        {/* ── Export Section ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.35,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className={cn("space-y-4", isMobile && "space-y-3")}
        >
          <div className="space-y-1">
            <h3 className="text-base font-medium">Export Bookmarks</h3>
            <p className="text-sm text-muted-foreground">
              Download all your bookmarks as an HTML file compatible with any
              browser.
            </p>
          </div>

          <div
            className={cn(
              "rounded-xl border border-border bg-muted/20",
              isMobile ? "p-4" : "p-5",
            )}
          >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Download className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                {isDataLoading ? (
                  <div className="space-y-1.5">
                    <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-36 rounded bg-muted animate-pulse" />
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium">
                      {bookmarks.length} bookmarks
                      {folders.length > 0 && ` · ${folders.length} folders`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Netscape Bookmark File Format
                    </p>
                  </>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {exportState === "idle" && (
                <motion.button
                  key="export-btn"
                  type="button"
                  onClick={handleExport}
                  disabled={isDataLoading}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1.5 rounded-lg bg-foreground text-background px-4 py-2 text-xs font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <Download className="size-3.5" />
                  Export
                </motion.button>
              )}
              {exportState === "exporting" && (
                <motion.div
                  key="export-loading"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </motion.div>
              )}
              {exportState === "done" && (
                <motion.div
                  key="export-done"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-green-600 dark:text-green-400"
                >
                  <CheckCircle2 className="size-4" />
                  Downloaded
                </motion.div>
              )}
              {exportState === "error" && (
                <motion.div
                  key="export-error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-destructive"
                >
                  <AlertCircle className="size-3.5" />
                  Failed
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        </motion.div>

        <Separator className={cn(isMobile && "my-4")} />

        {/* ── Import Section ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.35,
            delay: 0.08,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className={cn("space-y-4", isMobile && "space-y-3")}
        >
        <div className="space-y-1">
          <h3 className="text-base font-medium">Import Bookmarks</h3>
          <p className="text-sm text-muted-foreground">
            Upload an HTML bookmark file exported from any browser.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* Dropzone */}
          {(importState.status === "idle" ||
            importState.status === "error") && (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    fileInputRef.current?.click();
                  }
                }}
                role="button"
                tabIndex={0}
                className={cn(
                  "relative cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-all duration-200",
                  isDragging
                    ? "border-foreground/30 bg-muted/60 scale-[1.01]"
                    : "border-border hover:border-foreground/20 hover:bg-muted/30",
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".html,.htm"
                  onChange={handleFileInput}
                  className="sr-only"
                  aria-label="Upload bookmark file"
                />

                <div className="flex flex-col items-center gap-3">
                  <motion.div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg transition-colors",
                      isDragging ? "bg-foreground/10" : "bg-muted",
                    )}
                    animate={isDragging ? { scale: 1.08 } : { scale: 1 }}
                  >
                    <Upload className="size-4 text-muted-foreground" />
                  </motion.div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Drop your file here</p>
                    <p className="text-xs text-muted-foreground">
                      or click to pick it
                    </p>
                  </div>
                </div>
              </div>

              {importState.status === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-xs text-destructive"
                >
                  <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
                  <span>{importState.message}</span>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Parsing */}
          {importState.status === "parsing" && (
            <motion.div
              key="parsing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/20 p-10"
            >
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Reading bookmarks…
              </p>
            </motion.div>
          )}

          {/* Preview */}
          {importState.status === "previewing" && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-border bg-muted/20 p-6 space-y-5"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <FileText className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {importState.fileName}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <BookmarkIcon className="size-3" />
                      {importState.bookmarkCount} bookmarks
                    </span>
                    {importState.folderCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <FolderIcon className="size-3" />
                        {importState.folderCount} folders
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setImportState({ status: "idle" })}
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-foreground text-background px-3 py-2 text-xs font-medium hover:bg-foreground/90 transition-colors"
                >
                  Import all
                  <ChevronRight className="size-3" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Importing progress */}
          {importState.status === "importing" && (
            <motion.div
              key="importing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-border bg-muted/20 p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <Loader2 className="size-4 animate-spin text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Importing…</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {importState.imported} of {importState.total}
                  </p>
                </div>
              </div>

              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-foreground/70"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(importState.imported / importState.total) * 100}%`,
                  }}
                  transition={{
                    duration: 0.3,
                    ease: "easeOut",
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Done */}
          {importState.status === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/20 p-10"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: 0.1,
                }}
              >
                <CheckCircle2 className="size-8 text-green-500" />
              </motion.div>
              <div className="text-center">
                <p className="text-sm font-medium">All done!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {importState.imported} bookmarks imported
                  {importState.folders > 0
                    ? ` into ${importState.folders} folders`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setImportState({ status: "idle" })}
                className="mt-2 rounded-lg border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                Import more
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>
      </motion.div>
    </>
  );
}
