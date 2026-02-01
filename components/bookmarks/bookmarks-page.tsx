"use client"

import { useState, useMemo } from "react"
import {
    BookmarkIcon,
    SearchIcon,
    ChevronRightIcon,
    FolderIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { initialFolders } from "@/data/mock-data"

import { BookmarkCard } from "./bookmark-card"
import { FoldersSidebar } from "./folders-sidebar"
import { AddBookmarkDialog } from "./add-bookmark-dialog"
import type { Folder, Bookmark } from "./types"


export function BookmarksPage() {
    const [folders, setFolders] = useState<Folder[]>(initialFolders)
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
    const [selectedFolder, setSelectedFolder] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [sidebarOpen, setSidebarOpen] = useState(true)

    // Filter bookmarks based on folder and search
    const filteredBookmarks = useMemo(() => {
        let result = bookmarks

        if (selectedFolder !== "all") {
            if (selectedFolder === "favorites") {
                result = bookmarks.filter((b) => b.folderId === "favorites")
            } else {
                result = bookmarks.filter((b) => b.folderId === selectedFolder)
            }
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                (b) =>
                    b.title.toLowerCase().includes(query) ||
                    b.url.toLowerCase().includes(query)
            )
        }

        return result
    }, [bookmarks, selectedFolder, searchQuery])

    const currentFolder = folders.find((f) => f.id === selectedFolder)
    const editableFolders = folders.filter((f) => f.id !== "all" && f.id !== "favorites")

    // Add new bookmark
    const handleAddBookmark = (data: { url: string; title: string; favicon: string | null; ogImage: string | null; folderId: string }) => {
        const newBookmark: Bookmark = {
            id: Date.now().toString(),
            title: data.title,
            url: data.url,
            favicon: data.favicon || undefined,
            ogImage: data.ogImage || undefined,
            folderId: data.folderId || "all",
            createdAt: new Date(),
        }
        setBookmarks((prev) => [newBookmark, ...prev])

        // Update folder count
        if (data.folderId) {
            setFolders((prev) =>
                prev.map((f) =>
                    f.id === data.folderId ? { ...f, count: f.count + 1 } : f
                )
            )
        }
    }

    // Add new folder
    const handleAddFolder = (name: string) => {
        const newFolder: Folder = {
            id: Date.now().toString(),
            name,
            count: 0,
        }
        setFolders((prev) => [...prev, newFolder])
    }

    // Delete bookmark
    const handleDeleteBookmark = (bookmark: Bookmark) => {
        setBookmarks((prev) => prev.filter((b) => b.id !== bookmark.id))
        // Update folder count
        setFolders((prev) =>
            prev.map((f) =>
                f.id === bookmark.folderId ? { ...f, count: Math.max(0, f.count - 1) } : f
            )
        )
    }

    return (
        <div className="bg-background text-foreground flex h-screen w-full">
            {/* Sidebar */}
            <aside
                className={cn(
                    "border-border bg-card flex h-full flex-col border-r transition-all duration-200",
                    sidebarOpen ? "w-64" : "w-0 overflow-hidden"
                )}
            >
                <FoldersSidebar
                    folders={folders}
                    selectedFolder={selectedFolder}
                    onSelectFolder={setSelectedFolder}
                    onAddFolder={handleAddFolder}
                />
            </aside>

            {/* Main Content */}
            <main className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <header className="border-border flex items-center gap-3 border-b px-4 py-3">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="shrink-0"
                    >
                        <ChevronRightIcon
                            className={cn(
                                "size-4 transition-transform",
                                sidebarOpen && "rotate-180"
                            )}
                        />
                    </Button>

                    <div className="flex items-center gap-2">
                        {currentFolder?.icon ? (
                            <currentFolder.icon className="text-muted-foreground size-4" />
                        ) : (
                            <FolderIcon className="text-muted-foreground size-4" />
                        )}
                        <h1 className="text-sm font-medium">{currentFolder?.name}</h1>
                    </div>

                    <div className="relative ml-auto max-w-xs flex-1">
                        <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                        <Input
                            type="search"
                            placeholder="Search bookmarks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 pl-9 text-sm"
                        />
                    </div>

                    <AddBookmarkDialog folders={editableFolders} onSubmit={handleAddBookmark} />
                </header>

                {/* Bookmarks Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    {filteredBookmarks.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                            <div className="bg-muted flex size-12 items-center justify-center rounded-lg">
                                <BookmarkIcon className="text-muted-foreground size-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">No bookmarks found</p>
                                <p className="text-muted-foreground text-sm">
                                    {searchQuery
                                        ? "Try a different search term"
                                        : "Add your first bookmark to get started"}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredBookmarks.map((bookmark) => (
                                <BookmarkCard
                                    key={bookmark.id}
                                    bookmark={bookmark}
                                    onDelete={handleDeleteBookmark}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
