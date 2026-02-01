"use client"

import * as React from "react"
import { PlusIcon, Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import type { Folder, UrlMetadata } from "./types"

interface AddBookmarkDialogProps {
    folders: Folder[]
    onSubmit?: (data: { url: string; title: string; favicon: string | null; folderId: string }) => void
}

export function AddBookmarkDialog({ folders, onSubmit }: AddBookmarkDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [url, setUrl] = React.useState("")
    const [title, setTitle] = React.useState("")
    const [favicon, setFavicon] = React.useState<string | null>(null)
    const [folderId, setFolderId] = React.useState("")
    const [loading, setLoading] = React.useState(false)
    const debounceRef = React.useRef<NodeJS.Timeout | null>(null)

    // Auto-fetch metadata when URL changes
    const handleUrlChange = (newUrl: string) => {
        setUrl(newUrl)

        // Clear previous debounce
        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }

        // Validate URL format
        try {
            new URL(newUrl)
        } catch {
            return // Invalid URL, don't fetch
        }

        // Debounce the fetch
        debounceRef.current = setTimeout(async () => {
            setLoading(true)
            try {
                const response = await fetch(`/api/metadata?url=${encodeURIComponent(newUrl)}`)
                if (response.ok) {
                    const data: UrlMetadata = await response.json()
                    if (data.title && !title) {
                        setTitle(data.title)
                    }
                    if (data.favicon) {
                        setFavicon(data.favicon)
                    }
                }
            } catch (error) {
                console.error("Failed to fetch metadata:", error)
            } finally {
                setLoading(false)
            }
        }, 500)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (url.trim()) {
            onSubmit?.({
                url: url.trim(),
                title: title.trim() || url.trim(),
                favicon,
                folderId,
            })
            // Reset form
            setUrl("")
            setTitle("")
            setFavicon(null)
            setFolderId("")
            setOpen(false)
        }
    }

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (!isOpen) {
            // Reset on close
            setUrl("")
            setTitle("")
            setFavicon(null)
            setFolderId("")
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
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
                <form id="add-bookmark-form" onSubmit={handleSubmit}>
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="bookmark-url">URL</FieldLabel>
                            <div className="relative">
                                <Input
                                    id="bookmark-url"
                                    type="url"
                                    placeholder="https://example.com"
                                    value={url}
                                    onChange={(e) => handleUrlChange(e.target.value)}
                                    required
                                />
                                {loading && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
                                    </div>
                                )}
                            </div>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="bookmark-title">
                                Title
                                {favicon && (
                                    <img src={favicon} alt="" className="ml-2 inline-block size-4" />
                                )}
                            </FieldLabel>
                            <Input
                                id="bookmark-title"
                                type="text"
                                placeholder="My Bookmark"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="bookmark-folder">Folder</FieldLabel>
                            <NativeSelect
                                id="bookmark-folder"
                                value={folderId}
                                onChange={(e) => setFolderId(e.target.value)}
                            >
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
                    <Button type="submit" form="add-bookmark-form" disabled={loading}>
                        Save Bookmark
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
