/**
 * Parses Netscape Bookmark File HTML format (exported by Chrome, Firefox, Edge, Safari, Brave, etc.)
 * Returns flat array of bookmarks with their folder paths, plus a set of unique folder names.
 */

export interface ParsedBookmark {
    title: string;
    url: string;
    folder?: string; // Top-level folder name the bookmark belongs to
}

export interface ParseResult {
    bookmarks: ParsedBookmark[];
    folders: string[]; // Unique folder names found
    errors: string[];
}

export function parseBookmarkHtml(html: string): ParseResult {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const bookmarks: ParsedBookmark[] = [];
    const folderSet = new Set<string>();
    const errors: string[] = [];

    function walk(node: Element, currentFolder?: string) {
        for (const child of Array.from(node.children)) {
            if (child.tagName === "DT") {
                const heading = child.querySelector(":scope > H3");
                const link = child.querySelector(":scope > A");

                if (heading) {
                    // This DT contains a folder
                    const folderName = heading.textContent?.trim() || "Untitled Folder";

                    // Skip browser-internal folders like "Bookmarks Bar", "Other Bookmarks", etc.
                    // but still process their children
                    const isToolbarFolder =
                        heading.getAttribute("PERSONAL_TOOLBAR_FOLDER") === "true";
                    const isOtherFolder =
                        folderName === "Other Bookmarks" ||
                        folderName === "Other bookmarks" ||
                        folderName === "Mobile Bookmarks" ||
                        folderName === "Mobile bookmarks";

                    const effectiveFolder =
                        isToolbarFolder || isOtherFolder
                            ? currentFolder
                            : folderName;

                    if (effectiveFolder && !isToolbarFolder && !isOtherFolder) {
                        folderSet.add(effectiveFolder);
                    }

                    // Recurse into the DL that follows the H3
                    const subList = child.querySelector(":scope > DL");
                    if (subList) {
                        walk(subList, effectiveFolder);
                    }
                } else if (link) {
                    // This DT contains a bookmark link
                    const url = link.getAttribute("HREF");
                    const title = link.textContent?.trim() || "";

                    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
                        bookmarks.push({
                            title: title || url,
                            url,
                            folder: currentFolder,
                        });
                    }
                }
            } else if (child.tagName === "DL") {
                walk(child, currentFolder);
            }
        }
    }

    try {
        const rootDl = doc.querySelector("DL");
        if (!rootDl) {
            errors.push("No bookmark data found in file. Make sure this is a browser bookmark export.");
            return { bookmarks, folders: [], errors };
        }
        walk(rootDl);
    } catch (e) {
        errors.push(
            `Failed to parse bookmark file: ${e instanceof Error ? e.message : "Unknown error"}`
        );
    }

    return {
        bookmarks,
        folders: Array.from(folderSet),
        errors,
    };
}
