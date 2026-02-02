"use client";

import {
  ExternalLinkIcon,
  GlobeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getDomain } from "@/lib/utils";
import { useGeneralStore } from "@/hooks/use-general-store";
import type { Bookmark, DragData } from "./types";

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit?: (bookmark: Bookmark) => void;
  onDelete?: (bookmark: Bookmark) => void;
  /** Set for the first card in the list to improve LCP (Largest Contentful Paint) */
  priority?: boolean;
}

export function BookmarkCard({
  bookmark,
  onEdit,
  onDelete,
  priority = false,
}: BookmarkCardProps) {
  const [imageError, setImageError] = useState(false);
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

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "group relative gap-0 overflow-hidden py-0 transition-all duration-150",
        "cursor-grab active:cursor-grabbing hover:shadow-md",
        "w-full",
        isDragging &&
          "pointer-events-none z-20 scale-[1.02] opacity-0 shadow-lg ring-2 ring-primary/40",
      )}
    >
      {/* OG Image Preview */}
      {bookmark.ogImage && !imageError && bookmark.ogImage.startsWith("http") ? (
        <div className="relative aspect-[1.91/1] w-full overflow-hidden bg-muted">
          <Image
            src={bookmark.ogImage}
            alt=""
            fill
            className="object-cover transition-transform group-hover:scale-105"
            onError={() => setImageError(true)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            priority={priority}
          />
        </div>
      ) : (
        <div className="bg-muted/50 flex aspect-[1.91/1] w-full items-center justify-center">
          <GlobeIcon className="text-muted-foreground/50 size-6 sm:size-8" />
        </div>
      )}

      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Favicon */}
          {showFavicons && (
            <div className="bg-muted flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-md">
              {bookmark.favicon && bookmark.favicon.startsWith("http") ? (
                <Image
                  src={bookmark.favicon}
                  alt=""
                  width={16}
                  height={16}
                  className="size-3 sm:size-4 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove(
                      "hidden",
                    );
                  }}
                />
              ) : null}
              <GlobeIcon
                className={cn(
                  "text-muted-foreground size-3 sm:size-4",
                  bookmark.favicon && "hidden",
                )}
              />
            </div>
          )}

          {/* Title & URL */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm sm:text-base font-medium leading-tight mb-1">
              {bookmark.title}
            </p>
            <p className="text-muted-foreground truncate text-xs sm:text-sm">
              {getDomain(bookmark.url)}
            </p>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="opacity-0 sm:opacity-0 transition-opacity group-hover:opacity-100 active:opacity-100 shrink-0"
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
        </div>
      </CardContent>
    </Card>
  );
}
