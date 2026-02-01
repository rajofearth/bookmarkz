"use client"

import * as React from "react"
import {
    FolderIcon,
    BookmarkIcon,
    PlusIcon,
    SearchIcon,
    MoreHorizontalIcon,
    ExternalLinkIcon,
    PencilIcon,
    TrashIcon,
    ChevronRightIcon,
    FolderPlusIcon,
    StarIcon,
    GlobeIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Item,
    ItemActions,
    ItemContent,
    ItemGroup,
    ItemMedia,
    ItemTitle,
    ItemDescription,
} from "@/components/ui/item"
import { Badge } from "@/components/ui/badge"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

// Types
interface Folder {
    id: string
    name: string
    count: number
    icon?: React.ReactNode
}

interface Bookmark {
    id: string
    title: string
    url: string
    favicon?: string
    folderId: string
    createdAt: Date
}

// Mock data
const mockFolders: Folder[] = [
    { id: "all", name: "All Bookmarks", count: 12, icon: <BookmarkIcon className="size-4" /> },
    { id: "favorites", name: "Favorites", count: 5, icon: <StarIcon className="size-4" /> },
    { id: "dev", name: "Development", count: 4 },
    { id: "design", name: "Design", count: 3 },
    { id: "news", name: "News & Articles", count: 0 },
]

const mockBookmarks: Bookmark[] = [
    { id: "1", title: "GitHub", url: "https://github.com", favicon: "https://github.com/favicon.ico", folderId: "dev", createdAt: new Date() },
    { id: "2", title: "Vercel", url: "https://vercel.com", favicon: "https://vercel.com/favicon.ico", folderId: "dev", createdAt: new Date() },
    { id: "3", title: "Tailwind CSS", url: "https://tailwindcss.com", favicon: "https://tailwindcss.com/favicons/favicon.ico", folderId: "dev", createdAt: new Date() },
    { id: "4", title: "Figma", url: "https://figma.com", favicon: "https://figma.com/favicon.ico", folderId: "design", createdAt: new Date() },
    { id: "5", title: "Dribbble", url: "https://dribbble.com", favicon: "https://dribbble.com/favicon.ico", folderId: "design", createdAt: new Date() },
    { id: "6", title: "Next.js Documentation", url: "https://nextjs.org/docs", favicon: "https://nextjs.org/favicon.ico", folderId: "dev", createdAt: new Date() },
    { id: "7", title: "React", url: "https://react.dev", favicon: "https://react.dev/favicon.ico", folderId: "favorites", createdAt: new Date() },
    { id: "8", title: "MDN Web Docs", url: "https://developer.mozilla.org", folderId: "favorites", createdAt: new Date() },
]

// Helper to get domain from URL
function getDomain(url: string): string {
    try {
        return new URL(url).hostname.replace("www.", "")
    } catch {
        return url
    }
}

// Main Bookmarks Page Component
export function BookmarksPage() {
    const [selectedFolder, setSelectedFolder] = React.useState("all")
    const [searchQuery, setSearchQuery] = React.useState("")
    const [sidebarOpen, setSidebarOpen] = React.useState(true)

    const filteredBookmarks = React.useMemo(() => {
        let bookmarks = mockBookmarks

        if (selectedFolder !== "all") {
            if (selectedFolder === "favorites") {
                bookmarks = bookmarks.slice(0, 5) // Mock favorites
            } else {
                bookmarks = bookmarks.filter((b) => b.folderId === selectedFolder)
            }
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            bookmarks = bookmarks.filter(
                (b) =>
                    b.title.toLowerCase().includes(query) ||
                    b.url.toLowerCase().includes(query)
            )
        }

        return bookmarks
    }, [selectedFolder, searchQuery])

    const currentFolder = mockFolders.find((f) => f.id === selectedFolder)

    return (
        <div className="bg-background text-foreground flex h-screen w-full">
            {/* Sidebar */}
            <aside
                className={cn(
                    "border-border bg-card flex h-full flex-col border-r transition-all duration-200",
                    sidebarOpen ? "w-64" : "w-0 overflow-hidden"
                )}
            >
                <div className="flex items-center justify-between p-4">
                    <h2 className="text-sm font-medium">Folders</h2>
                    <AddFolderDialog />
                </div>
                <nav className="flex-1 overflow-y-auto px-2">
                    <ItemGroup className="gap-0.5">
                        {mockFolders.map((folder) => (
                            <Item
                                key={folder.id}
                                size="xs"
                                asChild
                                className={cn(
                                    "cursor-pointer rounded-md px-2",
                                    selectedFolder === folder.id && "bg-accent"
                                )}
                            >
                                <button
                                    type="button"
                                    onClick={() => setSelectedFolder(folder.id)}
                                    className="w-full"
                                >
                                    <ItemMedia className="text-muted-foreground">
                                        {folder.icon || <FolderIcon className="size-4" />}
                                    </ItemMedia>
                                    <ItemContent className="min-w-0">
                                        <ItemTitle className="truncate text-sm font-normal">
                                            {folder.name}
                                        </ItemTitle>
                                    </ItemContent>
                                    <ItemActions>
                                        <Badge variant="secondary" className="text-xs tabular-nums">
                                            {folder.count}
                                        </Badge>
                                    </ItemActions>
                                </button>
                            </Item>
                        ))}
                    </ItemGroup>
                </nav>
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
                        {currentFolder?.icon || <FolderIcon className="text-muted-foreground size-4" />}
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

                    <AddBookmarkDialog folders={mockFolders.filter((f) => f.id !== "all" && f.id !== "favorites")} />
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
                                <BookmarkCard key={bookmark.id} bookmark={bookmark} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

// Bookmark Card Component
function BookmarkCard({ bookmark }: { bookmark: Bookmark }) {
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
                            <DropdownMenuItem>
                                <PencilIcon className="size-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
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

// Add Bookmark Dialog
function AddBookmarkDialog({ folders }: { folders: Folder[] }) {
    const [open, setOpen] = React.useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <PlusIcon className="size-4" />
                    Add Bookmark
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Bookmark</DialogTitle>
                    <DialogDescription>
                        Save a link to your bookmarks collection.
                    </DialogDescription>
                </DialogHeader>
                <form
                    id="add-bookmark-form"
                    onSubmit={(e) => {
                        e.preventDefault()
                        setOpen(false)
                    }}
                >
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="bookmark-url">URL</FieldLabel>
                            <Input
                                id="bookmark-url"
                                type="url"
                                placeholder="https://example.com"
                                required
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="bookmark-title">Title</FieldLabel>
                            <Input
                                id="bookmark-title"
                                type="text"
                                placeholder="My Bookmark"
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="bookmark-folder">Folder</FieldLabel>
                            <NativeSelect id="bookmark-folder">
                                <NativeSelectOption value="">Select a folder</NativeSelectOption>
                                {folders.map((folder) => (
                                    <NativeSelectOption key={folder.id} value={folder.id}>
                                        {folder.name}
                                    </NativeSelectOption>
                                ))}
                            </NativeSelect>
                        </Field>
                    </FieldGroup>
                </form>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" form="add-bookmark-form">
                        Save Bookmark
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// Add Folder Dialog
function AddFolderDialog() {
    const [open, setOpen] = React.useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon-xs">
                    <FolderPlusIcon className="size-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Folder</DialogTitle>
                    <DialogDescription>
                        Organize your bookmarks into folders.
                    </DialogDescription>
                </DialogHeader>
                <form
                    id="add-folder-form"
                    onSubmit={(e) => {
                        e.preventDefault()
                        setOpen(false)
                    }}
                >
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="folder-name">Folder Name</FieldLabel>
                            <Input
                                id="folder-name"
                                type="text"
                                placeholder="My Folder"
                                required
                            />
                        </Field>
                    </FieldGroup>
                </form>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" form="add-folder-form">
                        Create Folder
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
