"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import type { UrlMetadata } from "@/components/bookmarks/types"

interface UseUrlMetadataOptions {
    /** Debounce delay in milliseconds. Default: 500 */
    debounceMs?: number
    /** Skip fetching if title is already set */
    skipIfTitleExists?: boolean
}

interface UseUrlMetadataReturn {
    metadata: UrlMetadata | null
    isLoading: boolean
    error: string | null
    fetchMetadata: (url: string) => void
    reset: () => void
}

/**
 * Custom hook for fetching URL metadata (title, favicon, og:image)
 * with debouncing and error handling.
 */
export function useUrlMetadata(options: UseUrlMetadataOptions = {}): UseUrlMetadataReturn {
    const { debounceMs = 500 } = options

    const [metadata, setMetadata] = useState<UrlMetadata | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const debounceRef = useRef<NodeJS.Timeout | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    const reset = useCallback(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        setMetadata(null)
        setIsLoading(false)
        setError(null)
    }, [])

    const fetchMetadata = useCallback((url: string) => {
        // Clear previous debounce
        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }

        // Abort previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        // Validate URL format
        try {
            new URL(url)
        } catch {
            return // Invalid URL, don't fetch
        }

        // Debounce the fetch
        debounceRef.current = setTimeout(async () => {
            setIsLoading(true)
            setError(null)

            abortControllerRef.current = new AbortController()

            try {
                const response = await fetch(
                    `/api/metadata?url=${encodeURIComponent(url)}`,
                    { signal: abortControllerRef.current.signal }
                )

                if (!response.ok) {
                    throw new Error(`Failed to fetch metadata: ${response.status}`)
                }

                const data: UrlMetadata = await response.json()
                setMetadata(data)
            } catch (err) {
                if (err instanceof Error && err.name === "AbortError") {
                    return // Request was aborted, ignore
                }
                console.error("Failed to fetch metadata:", err)
                setError(err instanceof Error ? err.message : "Failed to fetch metadata")
            } finally {
                setIsLoading(false)
            }
        }, debounceMs)
    }, [debounceMs])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [])

    return { metadata, isLoading, error, fetchMetadata, reset }
}
