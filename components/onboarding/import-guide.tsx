"use client";

import {
  AlertCircle,
  BookmarkIcon,
  CheckCircle2,
  ChevronRight,
  FileText,
  FolderIcon,
  Loader2,
  Upload,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useImportBookmarks } from "@/hooks/use-import-bookmarks";
import { cn } from "@/lib/utils";

export function ImportGuide() {
  const {
    importState,
    setImportState,
    isDragging,
    fileInputRef,
    handleImport,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleFileInput,
  } = useImportBookmarks();

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <motion.div
          className="flex flex-col items-center gap-4 text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="bg-muted flex size-12 items-center justify-center rounded-lg">
            <BookmarkIcon className="text-muted-foreground size-6" />
          </div>
          <div>
            <p className="text-sm font-medium">Bring your bookmarks over</p>
            <p className="text-muted-foreground text-sm mt-1">
              Export them from your browser, then drop the file here.
            </p>
          </div>
        </motion.div>

        {/* How to export — simple steps */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.1,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="space-y-2.5"
        >
          {[
            "Open your browser's bookmark manager",
            'Find the "Export" option and save the file',
            "Drop that file below — we'll do the rest",
          ].map((step, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              className="flex items-center gap-3"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                {i + 1}
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step}
              </p>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="flex items-center gap-2 pl-8 pt-1"
          >
            <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              Ctrl + Shift + O
            </kbd>
            <span className="text-[10px] text-muted-foreground/60">
              opens bookmarks in most browsers
            </span>
          </motion.div>
        </motion.div>

        {/* File Upload Zone */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.25,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <AnimatePresence mode="wait">
            {importState.status === "idle" || importState.status === "error" ? (
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
            ) : importState.status === "parsing" ? (
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
            ) : importState.status === "previewing" ? (
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
            ) : importState.status === "importing" ? (
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
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            ) : importState.status === "done" ? (
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
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
