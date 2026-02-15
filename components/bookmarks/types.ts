// Bookmark types
import type { LucideIcon } from "lucide-react";

export interface Folder {
  id: string;
  name: string;
  count: number;
  icon?: LucideIcon;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  ogImage?: string;
  description?: string;
  folderId: string;
  createdAt: Date;
}

export interface UrlMetadata {
  title: string;
  favicon: string | null;
  ogImage: string | null;
  description?: string;
}

export type DragData =
  | {
      type: "bookmark";
      bookmarkId: string;
    }
  | {
      type: "folder";
      folderId: string;
    };
