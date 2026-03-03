"use client";

import { useCallback, useRef, useState } from "react";
import { parseBookmarkHtml } from "@/lib/bookmark-parser";

type ImportFolderPayload = {
  id: string;
  name: string;
  parentId: null;
};

type ImportBookmarkPayload = {
  title: string;
  url: string;
  folderId?: string;
  addDate?: number;
};

type ImportResponse = {
  count?: number;
  movedCount?: number;
  error?: string;
};

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

  const buildImportPayload = useCallback(
    (
      raw: ReturnType<typeof parseBookmarkHtml>,
    ): {
      folders: ImportFolderPayload[];
      bookmarks: ImportBookmarkPayload[];
    } => {
      const folderNameToId = new Map<string, string>();
      const folders: ImportFolderPayload[] = [];
      let folderIndex = 0;

      const getFolderId = (folderName: string) => {
        const existingId = folderNameToId.get(folderName);
        if (existingId) {
          return existingId;
        }

        const folderId = `f-${folderIndex}`;
        folderIndex += 1;
        folderNameToId.set(folderName, folderId);
        folders.push({
          id: folderId,
          name: folderName,
          parentId: null,
        });
        return folderId;
      };

      for (const folderName of raw.folders) {
        getFolderId(folderName);
      }

      const bookmarks: ImportBookmarkPayload[] = raw.bookmarks.map(
        (bookmark) => ({
          title: bookmark.title,
          url: bookmark.url,
          addDate:
            typeof bookmark.addDate === "number"
              ? bookmark.addDate * 1000
              : undefined,
          folderId: bookmark.folder ? getFolderId(bookmark.folder) : undefined,
        }),
      );

      return { folders, bookmarks };
    },
    [],
  );

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
      const payload = buildImportPayload(raw);
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      let responseData: ImportResponse | null = null;
      try {
        responseData = (await response.json()) as ImportResponse;
      } catch {
        responseData = null;
      }

      if (!response.ok) {
        throw new Error(responseData?.error || "Failed to import bookmarks.");
      }

      const imported = Number(responseData?.count ?? 0);

      setImportState({
        status: "done",
        imported,
        folders: payload.folders.length,
      });
    } catch (error) {
      setImportState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    }
  }, [buildImportPayload, importState]);

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
