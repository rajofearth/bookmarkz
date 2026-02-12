/**
 * Generates a Netscape Bookmark File Format HTML string.
 * Matches the format exported by Chrome / Edge / Brave so the file
 * can be re-imported into any browser without issues.
 */

interface ExportBookmark {
  title: string;
  url: string;
  favicon?: string;
  createdAt: number; // Unix ms
  folderId?: string;
}

interface ExportFolder {
  _id: string;
  name: string;
  parentId?: string;
  createdAt: number;
}

export function generateBookmarkHtml(
  bookmarks: ExportBookmark[],
  folders: ExportFolder[],
): string {
  const folderMap = new Map<string, ExportFolder>();
  for (const f of folders) {
    folderMap.set(f._id, f);
  }

  // Group bookmarks by folderId (undefined = root)
  const byFolder = new Map<string | "__root__", ExportBookmark[]>();
  byFolder.set("__root__", []);

  for (const bm of bookmarks) {
    const key = bm.folderId ?? "__root__";
    if (!byFolder.has(key)) byFolder.set(key, []);
    byFolder.get(key)!.push(bm);
  }

  const toEpochSec = (ms: number) => Math.floor(ms / 1000);
  const nowSec = toEpochSec(Date.now());

  // Escape for HTML attribute values
  const escapeAttr = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  // Escape for HTML text content (includes apostrophe → &#39;)
  const escapeText = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/'/g, "&#39;");

  const lines: string[] = [
    "<!DOCTYPE NETSCAPE-Bookmark-file-1>",
    "<!-- This is an automatically generated file.",
    "     It will be read and overwritten.",
    "     DO NOT EDIT! -->",
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    "<TITLE>Bookmarks</TITLE>",
    "<H1>Bookmarks</H1>",
    "<DL><p>",
    // Wrap everything in a Bookmarks bar folder so browsers import to toolbar
    `    <DT><H3 ADD_DATE="${nowSec}" LAST_MODIFIED="${nowSec}" PERSONAL_TOOLBAR_FOLDER="true">Bookmarks bar</H3>`,
    "    <DL><p>",
  ];

  // Render a single bookmark line
  function renderBookmark(bm: ExportBookmark, indent: string) {
    const icon = bm.favicon ? ` ICON="${escapeAttr(bm.favicon)}"` : "";
    lines.push(
      `${indent}<DT><A HREF="${escapeAttr(bm.url)}" ADD_DATE="${toEpochSec(bm.createdAt)}"${icon}>${escapeText(bm.title)}</A>`,
    );
  }

  // Render a folder and its children recursively
  function renderFolder(folderId: string, indent: string) {
    const folder = folderMap.get(folderId);
    if (!folder) return;

    lines.push(
      `${indent}<DT><H3 ADD_DATE="${toEpochSec(folder.createdAt)}" LAST_MODIFIED="${nowSec}">${escapeText(folder.name)}</H3>`,
    );
    lines.push(`${indent}<DL><p>`);

    // Child folders (folders whose parentId === this folder)
    for (const child of folders) {
      if (child.parentId === folderId) {
        renderFolder(child._id, indent + "    ");
      }
    }

    // Bookmarks in this folder
    const folderBookmarks = byFolder.get(folderId) ?? [];
    for (const bm of folderBookmarks) {
      renderBookmark(bm, indent + "    ");
    }

    lines.push(`${indent}</DL><p>`);
  }

  // Root-level bookmarks (no folder) go first, then folders — matching browser order
  const rootBookmarks = byFolder.get("__root__") ?? [];
  for (const bm of rootBookmarks) {
    renderBookmark(bm, "        ");
  }

  // Render top-level folders (those with no parentId)
  for (const folder of folders) {
    if (!folder.parentId) {
      renderFolder(folder._id, "        ");
    }
  }

  // Close "Bookmarks bar" folder + root
  lines.push("    </DL><p>");
  lines.push("</DL><p>");

  return lines.join("\n");
}

/**
 * Triggers a browser download of the bookmark HTML file.
 */
export function downloadBookmarkFile(html: string, filename?: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    filename ?? `bukmarks-export-${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
