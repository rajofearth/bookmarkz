"use client"

import { GlobeIcon, MoreHorizontalIcon, ExternalLinkIcon, PencilIcon, TrashIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Bookmark } from "./types"

function getDomain(url: string): string {
    try {
        return new URL(url).hostname.replace("www.", "")
    } catch {
        return url
    }
}

interface BookmarkCardProps {
    bookmark: Bookmark
    onEdit?: (bookmark: Bookmark) => void
    onDelete?: (bookmark: Bookmark) => void
}

export function BookmarkCard({ bookmark, onEdit, onDelete }: BookmarkCardProps) {
    return (
        <Card className="group relative gap-0 py-0 transition-all hover:shadow-md">
            <CardContent className="p-3">
                <div className="flex items-start gap-3">
                    <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-md">
                        {bookmark.favicon ? (
                            <img
                                src={bookmark.favicon}
                                alt=""
                                className="size-5 object-contain"
                                onError={(e) => {
                                    e.currentTarget.style.display = "none"
                                    e.currentTarget.nextElementSibling?.classList.remove("hidden")
                                }}
                            />
                        ) : null}
                        <GlobeIcon className={cn("text-muted-foreground size-5", bookmark.favicon && "hidden")} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{bookmark.title}</p>
                        <p className="text-muted-foreground truncate text-xs">
                            {getDomain(bookmark.url)}
                        </p>
                    </div>
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
                                <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
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
    )
}
