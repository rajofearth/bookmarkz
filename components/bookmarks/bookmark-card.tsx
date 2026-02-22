"use client";

import { useDraggable } from "@dnd-kit/core";
import {
  ExternalLinkIcon,
  FolderIcon,
  GlobeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import Image from "next/image";
import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ViewMode } from "@/hooks/use-general-store";
import { cn, getDomain } from "@/lib/utils";
import { MoveBookmarkDialog } from "./move-bookmark-dialog";
import type { Bookmark, DragData, Folder } from "./types";

interface BookmarkCardProps {
  bookmark: Bookmark;
  folderName?: string;
  viewMode?: ViewMode;
  openInNewTab?: boolean;
  showFavicons?: boolean;
  onEdit?: (bookmark: Bookmark) => void;
  onDelete?: (bookmark: Bookmark) => void;
  onMove?: (bookmarkId: string, folderId: string) => Promise<void> | void;
  folders?: Folder[];
  /** Set for the first card in the list to improve LCP (Largest Contentful Paint) */
  priority?: boolean;
}

function BookmarkCardComponent({
  bookmark,
  folderName,
  viewMode = "normal",
  openInNewTab = true,
  showFavicons = true,
  onEdit,
  onDelete,
  onMove,
  folders,
  priority = false,
}: BookmarkCardProps) {
  const [imageError, setImageError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
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
  const faviconSize = isRowMode
    ? "size-6"
    : viewMode === "compact"
      ? "size-6"
      : "size-7 sm:size-8";
  const faviconImgSize = isRowMode
    ? "size-4"
    : viewMode === "compact"
      ? "size-3"
      : "size-3 sm:size-4";

  const showFaviconImage =
    showFavicons &&
    bookmark.favicon &&
    bookmark.favicon.startsWith("http") &&
    !faviconError;

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
      {showFaviconImage && bookmark.favicon ? (
        <Image
          src={bookmark.favicon}
          alt=""
          width={16}
          height={16}
          className={cn(faviconImgSize, "object-contain")}
          onError={() => setFaviconError(true)}
        />
      ) : null}
      <GlobeIcon
        className={cn(
          "text-muted-foreground",
          faviconImgSize,
          showFaviconImage && "hidden",
        )}
      />
    </div>
  ) : null;

  // ── Move dialog (shared) ──
  const moveDialog =
    onMove && folders && folders.length > 0 ? (
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
          "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
          "cursor-grab active:cursor-grabbing",
          viewMode === "details" && "border-b border-border/60",
          isDragging && "pointer-events-none z-20 opacity-0 invisible",
        )}
      >
        {!isDragging && (
          <div className="absolute inset-0 z-0 rounded-lg bg-accent/50 pointer-events-none opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        )}
        <div className="relative z-10 flex items-center gap-3 min-w-0 flex-1">
          {faviconEl}

          {/* Title and optional description */}
          <div className="min-w-0 flex-1">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-sm font-medium leading-tight block"
            >
              {bookmark.title}
            </a>
            {bookmark.description && viewMode === "details" && (
              <p className="truncate text-xs text-muted-foreground/80 mt-0.5">
                {bookmark.description}
              </p>
            )}
          </div>

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
        </div>
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
          isDragging && "pointer-events-none z-20 opacity-0 invisible",
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
              <span className="min-w-0 truncate">
                {getDomain(bookmark.url)}
              </span>
              <span className="shrink-0 text-muted-foreground/50">
                · {metaLine}
              </span>
            </p>
            {bookmark.description && (
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground/60">
                {bookmark.description}
              </p>
            )}
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
        isDragging && "pointer-events-none z-20 opacity-0 invisible",
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
          {bookmark.ogImage &&
          !imageError &&
          bookmark.ogImage.startsWith("http") ? (
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
          {bookmark.description && (
            <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground/70">
              {bookmark.description}
            </p>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground/60">
            {metaLine}
          </p>
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

export const BookmarkCard = memo(
  BookmarkCardComponent,
  (prev, next) =>
    prev.bookmark.id === next.bookmark.id &&
    prev.bookmark.title === next.bookmark.title &&
    prev.bookmark.url === next.bookmark.url &&
    prev.bookmark.description === next.bookmark.description &&
    prev.bookmark.favicon === next.bookmark.favicon &&
    prev.bookmark.ogImage === next.bookmark.ogImage &&
    prev.bookmark.folderId === next.bookmark.folderId &&
    prev.bookmark.createdAt.getTime() === next.bookmark.createdAt.getTime() &&
    prev.folderName === next.folderName &&
    prev.viewMode === next.viewMode &&
    prev.openInNewTab === next.openInNewTab &&
    prev.showFavicons === next.showFavicons &&
    prev.priority === next.priority &&
    prev.onEdit === next.onEdit &&
    prev.onDelete === next.onDelete &&
    prev.onMove === next.onMove &&
    prev.folders === next.folders,
);
