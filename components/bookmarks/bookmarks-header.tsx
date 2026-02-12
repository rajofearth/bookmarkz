"use client";

import { ChevronRightIcon, FolderIcon, SearchIcon } from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DisplayControlsMenu } from "./display-controls-menu";

interface DesktopBookmarksHeaderProps {
  currentFolderName?: string;
  CurrentFolderIcon?: ElementType;
  sidebarOpen: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onToggleSidebar: () => void;
  addBookmarkButton: ReactNode;
}

export function DesktopBookmarksHeader({
  currentFolderName,
  CurrentFolderIcon,
  sidebarOpen,
  searchQuery,
  onSearchChange,
  onToggleSidebar,
  addBookmarkButton,
}: DesktopBookmarksHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onToggleSidebar}
        className="shrink-0"
      >
        <ChevronRightIcon
          className={cn(
            "size-4 transition-transform",
            sidebarOpen && "rotate-180",
          )}
        />
      </Button>

      <div className="flex items-center gap-2 min-w-0">
        {CurrentFolderIcon ? (
          <CurrentFolderIcon className="text-muted-foreground size-4" />
        ) : (
          <FolderIcon className="text-muted-foreground size-4" />
        )}
        <h1 className="text-sm font-medium truncate">{currentFolderName}</h1>
      </div>

      <div className="relative ml-auto max-w-xs flex-1">
        <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          id="search-input-desktop"
          type="search"
          placeholder="Search bookmarks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 pl-9 text-sm"
        />
      </div>

      <DisplayControlsMenu />
      {addBookmarkButton}
    </div>
  );
}

interface MobileBookmarksHeaderProps {
  currentFolderName?: string;
  CurrentFolderIcon?: ElementType;
  showMobileSearch: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onToggleSearch: () => void;
  addBookmarkButton: ReactNode;
}

export function MobileBookmarksHeader({
  currentFolderName,
  CurrentFolderIcon,
  showMobileSearch,
  searchQuery,
  onSearchChange,
  onToggleSearch,
  addBookmarkButton,
}: MobileBookmarksHeaderProps) {
  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {CurrentFolderIcon ? (
            <CurrentFolderIcon className="text-muted-foreground size-4 shrink-0" />
          ) : (
            <FolderIcon className="text-muted-foreground size-4 shrink-0" />
          )}
          <h1 className="text-sm font-medium truncate">{currentFolderName}</h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="icon-sm" onClick={onToggleSearch}>
            <SearchIcon className="size-4" />
          </Button>
          <DisplayControlsMenu />
          {addBookmarkButton}
        </div>
      </div>

      {showMobileSearch && (
        <div className="px-4 pb-3 border-t border-border/50">
          <div className="relative">
            <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              id="search-input"
              type="search"
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 pl-9 text-sm w-full"
              autoFocus={showMobileSearch}
            />
          </div>
        </div>
      )}
    </>
  );
}
