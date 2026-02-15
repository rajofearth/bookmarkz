"use client";

import { useMutation } from "convex/react";
import { useCallback, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { parseBookmarkHtml } from "@/lib/bookmark-parser";
import { IMPORT_CHUNK_SIZE } from "@/lib/import-constants";

export type ImportState =
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

export function useImportBookmarks() {
  const [importState, setImportState] = useState<ImportState>({
    status: "idle",
  });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const batchCreateBookmarks = useMutation(api.bookmarks.batchCreateBookmarks);
  const createFolder = useMutation(api.bookmarks.createFolder);

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

      let imported = 0;

      for (let i = 0; i < raw.bookmarks.length; i += IMPORT_CHUNK_SIZE) {
        const chunk = raw.bookmarks.slice(i, i + IMPORT_CHUNK_SIZE);
        const bookmarksToCreate = chunk.map((b) => ({
          title: b.title,
          url: b.url,
          addDate: b.addDate != null ? b.addDate * 1000 : undefined,
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

  return {
    importState,
    setImportState,
    isDragging,
    fileInputRef,
    handleImport,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleFileInput,
  };
}
