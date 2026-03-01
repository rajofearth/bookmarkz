"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FolderIcon, GlobeIcon } from "lucide-react";
import Image from "next/image";
import { FlipReveal } from "@/components/gsap/flip-reveal";
import { useGeneralStore } from "@/hooks/use-general-store";
import { getViewModeGridClasses } from "@/lib/bookmarks-utils";
import { cn } from "@/lib/utils";
import type { FolderViewItem } from "./types";

interface FoldersContentProps {
  isLoading: boolean;
  foldersCount: number;
  filteredFolders: FolderViewItem[];
  searchQuery: string;
  onOpenFolder: (folderId: string) => void;
}

export function FoldersContent({
  isLoading,
  foldersCount,
  filteredFolders,
  searchQuery,
  onOpenFolder,
}: FoldersContentProps) {
  const { viewMode } = useGeneralStore();
  const isRowMode = viewMode === "list" || viewMode === "details";

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading your folders...
      </div>
    );
  }

  if (foldersCount === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <div className="bg-muted flex size-12 items-center justify-center rounded-lg">
          <FolderIcon className="text-muted-foreground size-6" />
        </div>
        <div>
          <p className="text-sm font-medium">No folders yet</p>
          <p className="text-muted-foreground text-sm">
            Create your first folder to organize bookmarks
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {filteredFolders.length === 0 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 text-center">
          <div className="bg-muted flex size-12 items-center justify-center rounded-lg">
            <FolderIcon className="text-muted-foreground size-6" />
          </div>
          <div>
            <p className="text-sm font-medium">No folders found</p>
            <p className="text-muted-foreground text-sm">
              {searchQuery
                ? "Try a different search term"
                : "No folders to show"}
            </p>
          </div>
        </div>
      )}
      <FlipReveal
        keys={filteredFolders.map((folder) => String(folder.id))}
        showClass="block"
        hideClass="hidden"
      >
        <div className={cn(getViewModeGridClasses(viewMode))}>
          <AnimatePresence initial={false} mode="popLayout">
            {filteredFolders.map((folder) => (
              <motion.button
                key={folder.id}
                type="button"
                data-flip={String(folder.id)}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={() => onOpenFolder(folder.id)}
                className={cn(
                  "group text-left",
                  isRowMode
                    ? "relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-accent/50"
                    : viewMode === "compact"
                      ? "relative overflow-hidden rounded-lg border border-border/60 bg-card transition-all duration-150 hover:border-border hover:shadow-sm"
                      : "relative overflow-hidden rounded-xl border border-border/60 bg-card transition-all duration-150 hover:border-border hover:shadow-md",
                )}
              >
                {isRowMode ? (
                  <>
                    <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-md">
                      <FolderIcon className="text-muted-foreground size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {folder.name}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {folder.count} {folder.count === 1 ? "item" : "items"}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative aspect-[1.91/1] w-full overflow-hidden bg-muted/50">
                      {folder.previewImage ? (
                        <Image
                          src={folder.previewImage}
                          alt=""
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <GlobeIcon className="text-muted-foreground/40 size-8 sm:size-10" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-start gap-2.5 p-3 sm:p-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium leading-snug sm:text-[15px]">
                          {folder.name}
                        </p>
                        <p className="mt-1 truncate text-xs text-muted-foreground/80">
                          {folder.count} {folder.count === 1 ? "item" : "items"}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </FlipReveal>
    </div>
  );
}
