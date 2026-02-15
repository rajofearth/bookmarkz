import type { Id } from "@/convex/_generated/dataModel";
import type { ViewMode } from "@/hooks/use-general-store";

export const VIEW_MODE_GRID_CLASSES: Record<ViewMode, string> = {
  normal: "grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  compact:
    "grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  list: "flex flex-col gap-1",
  details: "flex flex-col gap-0",
};

export function getViewModeGridClasses(viewMode: ViewMode): string {
  return VIEW_MODE_GRID_CLASSES[viewMode];
}

export type SortMode = "newest" | "oldest";

export const FOLDER_ID_ALL = "all" as const;

export function toConvexFolderId(
  folderId: string | undefined,
): Id<"folders"> | undefined {
  if (!folderId || folderId === FOLDER_ID_ALL) return undefined;
  return folderId as Id<"folders">;
}

export function fromConvexFolderId(folderId: string | undefined): string {
  return folderId ?? FOLDER_ID_ALL;
}

export function sortBookmarksByDate<T extends { createdAt: Date }>(
  items: T[],
  sortMode: SortMode,
): T[] {
  return [...items].sort((a, b) => {
    const aTime = a.createdAt.getTime();
    const bTime = b.createdAt.getTime();
    return sortMode === "newest" ? bTime - aTime : aTime - bTime;
  });
}

export function filterBookmarksBySearch<
  T extends { title: string; url: string },
>(items: T[], query: string): T[] {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(
    (b) => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q),
  );
}
