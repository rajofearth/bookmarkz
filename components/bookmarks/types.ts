// Bookmark types

export interface Folder {
    id: string
    name: string
    count: number
    icon?: React.ReactNode
}

export interface Bookmark {
    id: string
    title: string
    url: string
    favicon?: string
    ogImage?: string
    folderId: string
    createdAt: Date
}

export interface UrlMetadata {
    title: string
    favicon: string | null
    ogImage: string | null
    description?: string
}
