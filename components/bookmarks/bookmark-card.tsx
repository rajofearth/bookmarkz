"use client";

import {
  ExternalLinkIcon,
  FolderIcon,
  GlobeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getDomain } from "@/lib/utils";
import { useGeneralStore, type ViewMode } from "@/hooks/use-general-store";
import type { Bookmark, DragData, Folder } from "./types";
import { MoveBookmarkDialog } from "./move-bookmark-dialog";

interface BookmarkCardProps {
  bookmark: Bookmark;
  folderName?: string;
  viewMode?: ViewMode;
  onEdit?: (bookmark: Bookmark) => void;
  onDelete?: (bookmark: Bookmark) => void;
  onMove?: (bookmarkId: string, folderId: string) => Promise<void> | void;
  folders?: Folder[];
  /** Set for the first card in the list to improve LCP (Largest Contentful Paint) */
  priority?: boolean;
}

export function BookmarkCard({
  bookmark,
  folderName,
  viewMode = "normal",
  onEdit,
  onDelete,
  onMove,
  folders,
  priority = false,
}: BookmarkCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const { openInNewTab, showFavicons } = useGeneralStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: bookmark.id,
    data: {
      type: "bookmark",
      bookmarkId: bookmark.id,
    } satisfies DragData,
  });

  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    }
    : undefined;

  const isRowMode = viewMode === "list" || viewMode === "details";
  const showOgImage = viewMode === "normal";
  const dateShort = bookmark.createdAt.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
  const folderLabel = folderName ?? "Unsorted";

  // ── Actions dropdown (shared by all modes) ──
  const actionsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className="opacity-100 md:opacity-0 transition-opacity md:group-hover:opacity-100 active:opacity-100 shrink-0"
        >
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a
            href={bookmark.url}
            target={openInNewTab ? "_blank" : "_self"}
            rel={openInNewTab ? "noopener noreferrer" : undefined}
          >
            <ExternalLinkIcon className="size-4" />
            Open
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit?.(bookmark)}>
          <PencilIcon className="size-4" />
          Edit
        </DropdownMenuItem>
        {onMove && folders && folders.length > 0 && (
          <DropdownMenuItem onClick={() => setIsMoveDialogOpen(true)}>
            <FolderIcon className="size-4" />
            Move to folder
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => onDelete?.(bookmark)}
        >
          <TrashIcon className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // ── Favicon element (shared) ──
  const faviconSize = isRowMode ? "size-6" : viewMode === "compact" ? "size-6" : "size-7 sm:size-8";
  const faviconImgSize = isRowMode ? "size-4" : viewMode === "compact" ? "size-3" : "size-3 sm:size-4";

  const faviconEl = showFavicons ? (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md overflow-hidden",
        isRowMode
          ? "bg-white/90 ring-1 ring-black/5 dark:bg-white/20 dark:ring-white/15"
          : "bg-muted",
        faviconSize,
      )}
    >
      {bookmark.favicon && bookmark.favicon.startsWith("http") ? (
        <Image
          src={bookmark.favicon}
          alt=""
          width={16}
          height={16}
          className={cn(faviconImgSize, "object-contain")}
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextElementSibling?.classList.remove("hidden");
          }}
        />
      ) : null}
      <GlobeIcon
        className={cn(
          "text-muted-foreground",
          faviconImgSize,
          bookmark.favicon && bookmark.favicon.startsWith("http") && "hidden",
        )}
      />
    </div>
  ) : null;

  // ── Move dialog (shared) ──
  const moveDialog = onMove && folders && folders.length > 0 ? (
    <MoveBookmarkDialog
      bookmark={bookmark}
      folders={folders}
      open={isMoveDialogOpen}
      onOpenChange={setIsMoveDialogOpen}
      onMove={onMove}
    />
  ) : null;

  // ── LIST / DETAILS mode ──
  if (isRowMode) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={cn(
          "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
          "cursor-grab active:cursor-grabbing hover:bg-accent/40",
          viewMode === "details" && "border-b border-border/60",
          isDragging && "pointer-events-none z-20 opacity-0",
        )}
      >
        {faviconEl}

        {/* Title */}
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 truncate text-sm font-medium leading-tight"
        >
          {bookmark.title}
        </a>

        {/* Domain */}
        <span className="text-muted-foreground hidden sm:block text-xs shrink-0 w-36 truncate text-right">
          {getDomain(bookmark.url)}
        </span>

        {/* Folder and date in list mode */}
        {viewMode === "list" && (
          <span className="text-muted-foreground hidden md:block text-xs shrink-0 max-w-48 truncate text-right">
             · {folderLabel} · {dateShort}
          </span>
        )}

        {/* Folder in details mode */}
        {viewMode === "details" && (
          <span className="text-muted-foreground hidden lg:block text-xs shrink-0 w-32 truncate text-right">
            {folderLabel}
          </span>
        )}

        {/* Date (details only) */}
        {viewMode === "details" && (
          <span className="text-muted-foreground hidden md:block text-xs shrink-0 w-28 text-right">
            {bookmark.createdAt.toLocaleDateString()}
          </span>
        )}

        {actionsMenu}
        {moveDialog}
      </div>
    );
  }

  const metaLine = `${folderLabel} · ${dateShort}`;

  // ── COMPACT mode ──
  if (viewMode === "compact") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={cn(
          "group relative overflow-hidden rounded-lg border border-border/60 bg-card transition-all duration-150",
          "cursor-grab active:cursor-grabbing hover:border-border hover:shadow-sm",
          "w-full",
          isDragging &&
            "pointer-events-none z-20 scale-[0.98] opacity-50 shadow-lg ring-2 ring-primary/30",
        )}
      >
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 sm:p-2.5"
        >
          {faviconEl}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight">
              {bookmark.title}
            </p>
            <p className="flex min-w-0 gap-1 overflow-hidden text-[11px] text-muted-foreground/70">
              <span className="min-w-0 truncate">{getDomain(bookmark.url)}</span>
              <span className="shrink-0 text-muted-foreground/50">· {metaLine}</span>
            </p>
          </div>
        </a>
        <div className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          {actionsMenu}
        </div>
        {moveDialog}
      </div>
    );
  }

  // ── NORMAL mode ──
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/60 bg-card transition-all duration-150",
        "cursor-grab active:cursor-grabbing hover:border-border hover:shadow-md",
        "w-full",
        isDragging &&
          "pointer-events-none z-20 scale-[0.98] opacity-50 shadow-lg ring-2 ring-primary/30",
      )}
    >
      {/* Image */}
      {showOgImage && (
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative aspect-[1.91/1] w-full overflow-hidden bg-muted/50"
        >
          {bookmark.ogImage && !imageError && bookmark.ogImage.startsWith("http") ? (
            <>
              <Image
                src={bookmark.ogImage}
                alt=""
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                onError={() => setImageError(true)}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                priority={priority}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <GlobeIcon className="text-muted-foreground/40 size-8 sm:size-10" />
            </div>
          )}
        </a>
      )}

      {/* Content */}
      <div className="flex items-start gap-2.5 p-3 sm:p-3.5">
        {faviconEl}
        <div className="min-w-0 flex-1">
          <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
            <p className="truncate text-sm font-medium leading-snug sm:text-[15px]">
              {bookmark.title}
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground/80">
              {getDomain(bookmark.url)}
            </p>
          </a>
          <p className="mt-2 text-[11px] text-muted-foreground/60">{metaLine}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="absolute right-2 top-2 sm:right-3 sm:top-3 opacity-0 transition-opacity group-hover:opacity-100">
        {actionsMenu}
      </div>
      {moveDialog}
    </div>
  );
}
