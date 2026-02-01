import { BookmarkIcon, StarIcon } from "lucide-react"
import type { Folder } from "@/components/bookmarks/types"

/**
 * Initial folders for the bookmarks app.
 * Replace with real data source (database, API) in production.
 */
export const initialFolders: Folder[] = [
    { id: "all", name: "All Bookmarks", count: 8, icon: BookmarkIcon },
    { id: "favorites", name: "Favorites", count: 2, icon: StarIcon },
    { id: "dev", name: "Development", count: 4 },
    { id: "design", name: "Design", count: 2 },
    { id: "news", name: "News & Articles", count: 0 },
]
