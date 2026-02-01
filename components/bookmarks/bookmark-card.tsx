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
import type { Bookmark } from "./types";

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit?: (bookmark: Bookmark) => void;
  onDelete?: (bookmark: Bookmark) => void;
}

export function BookmarkCard({
  bookmark,
  onEdit,
  onDelete,
}: BookmarkCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Card className="group relative gap-0 overflow-hidden py-0 transition-all hover:shadow-md">
      {/* OG Image Preview */}
      {bookmark.ogImage && !imageError ? (
        <div className="relative aspect-[1.91/1] w-full overflow-hidden bg-muted">
          <Image
            src={bookmark.ogImage}
            alt=""
            fill
            className="object-cover transition-transform group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className="bg-muted/50 flex aspect-[1.91/1] w-full items-center justify-center">
          <GlobeIcon className="text-muted-foreground/50 size-8" />
        </div>
      )}

      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Favicon */}
          <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-md">
            {bookmark.favicon ? (
              <Image
                src={bookmark.favicon}
                alt=""
                width={16}
                height={16}
                className="size-4 object-contain"
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
                "text-muted-foreground size-4",
                bookmark.favicon && "hidden",
              )}
            />
          </div>

          {/* Title & URL */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{bookmark.title}</p>
            <p className="text-muted-foreground truncate text-xs">
              {getDomain(bookmark.url)}
            </p>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
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
