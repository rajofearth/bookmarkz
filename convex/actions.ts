"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import * as cheerio from "cheerio";

export const fetchMetadata = action({
    args: { url: v.string() },
    handler: async (ctx, args) => {
        try {
            // SSRF protection: validate URL before fetching
            let parsedUrl: URL;
            try {
                parsedUrl = new URL(args.url);
            } catch {
                throw new Error(`Invalid URL: ${args.url}`);
            }

            if (!["http:", "https:"].includes(parsedUrl.protocol)) {
                throw new Error(`Unsupported protocol: ${parsedUrl.protocol}`);
            }

            const hostname = parsedUrl.hostname.toLowerCase();
            const isPrivate =
                hostname === "localhost" ||
                hostname === "127.0.0.1" ||
                hostname === "[::1]" ||
                hostname.startsWith("10.") ||
                hostname.startsWith("192.168.") ||
                /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
                hostname.endsWith(".local");
            if (isPrivate) {
                throw new Error(`Blocked request to private/local address: ${hostname}`);
            }

            // Timeout protection
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(args.url, {
                signal: controller.signal,
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                },
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Failed to fetch ${args.url}: ${response.statusText}`);
            }

            const html = await response.text();
            const $ = cheerio.load(html);

            // Open Graph
            const ogImage = $("meta[property='og:image']").attr("content");
            const ogTitle = $("meta[property='og:title']").attr("content");

            // Twitter Card
            const twitterImage = $("meta[name='twitter:image']").attr("content");
            const twitterTitle = $("meta[name='twitter:title']").attr("content");

            // Standard
            const title = $("title").text();
            const normalizeUrl = (url: string | undefined, baseUrl: string) => {
                if (!url) return undefined;
                try {
                    // Handle protocol-relative URLs
                    if (url.startsWith("//")) {
                        return `https:${url}`;
                    }
                    // Handle relative URLs
                    if (!url.startsWith("http")) {
                        return new URL(url, baseUrl).href;
                    }
                    return url;
                } catch (e) {
                    return undefined;
                }
            };

            const urlObj = new URL(args.url);
            const baseUrl = urlObj.origin;

            let favicon = $("link[rel='icon']").attr("href") || $("link[rel='shortcut icon']").attr("href");
            favicon = normalizeUrl(favicon, baseUrl);

            // Fallback to Google Favicon service if no favicon found
            if (!favicon) {
                favicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
            }

            let finalOgImage = ogImage || twitterImage;
            finalOgImage = normalizeUrl(finalOgImage, baseUrl);

            return {
                title: ogTitle || twitterTitle || title,
                ogImage: finalOgImage,
                favicon: favicon,
            };
        } catch (error) {
            console.error(`Error fetching metadata for ${args.url}:`, error);
            // Return nulls on failure so we can mark it as failed or keep old data
            return {
                title: undefined,
                ogImage: undefined,
                favicon: undefined,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    },
});
