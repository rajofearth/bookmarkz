"use client";

import { ChevronRightIcon, FolderIcon, SearchIcon } from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { DotFlow } from "@/components/gsap/dot-flow";
import { DotLoader } from "@/components/gsap/dot-loader";
import { UnicodeSpinner } from "@/components/gsap/unicode-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGeneralStore } from "@/hooks/use-general-store";
import { cn } from "@/lib/utils";
import { DisplayControlsMenu } from "./display-controls-menu";

type SearchMode = "lexical" | "semantic";
type SemanticStage = "idle" | "embedding" | "vectorSearch" | "rerank" | "error";

const sweepFrames = [
  [3, 10, 17, 24, 31, 38, 45],
  [4, 11, 18, 25, 32, 39, 46],
  [5, 12, 19, 26, 33, 40, 47],
  [6, 13, 20, 27, 34, 41, 48],
];

const pulseFrames = [
  [16, 17, 18, 23, 24, 25, 30, 31, 32],
  [10, 11, 12, 17, 18, 19, 24, 25, 26, 31, 32, 33, 38, 39, 40],
  [
    2, 3, 4, 9, 10, 11, 16, 17, 18, 23, 24, 25, 30, 31, 32, 37, 38, 39, 44, 45,
    46,
  ],
];

function SearchStatus({
  searchMode,
  isSemanticLoading,
  semanticStage,
  semanticLatencyMs,
}: {
  searchMode: SearchMode;
  isSemanticLoading: boolean;
  semanticStage: SemanticStage;
  semanticLatencyMs: number | null;
}) {
  const reducedMotion = useGeneralStore((state) => state.reducedMotion);
  const flowItems = [
    { title: "Embedding", frames: sweepFrames, duration: 90 },
    { title: "Vector search", frames: pulseFrames, duration: 110 },
    { title: "Reranking", frames: sweepFrames, duration: 90 },
  ];

  return (
    <div className="inline-flex items-center gap-2">
      <Badge variant={searchMode === "semantic" ? "default" : "secondary"}>
        {searchMode === "semantic" ? "Semantic" : "Lexical"}
      </Badge>
      {searchMode === "semantic" &&
        isSemanticLoading &&
        (reducedMotion ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <UnicodeSpinner name="braille" className="font-mono" />
            Searching
          </span>
        ) : semanticStage === "embedding" ? (
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <DotLoader frames={sweepFrames} duration={90} size={2.75} />
            Embedding
          </span>
        ) : (
          <DotFlow isPlaying items={flowItems} />
        ))}
      {searchMode === "semantic" &&
        !isSemanticLoading &&
        semanticLatencyMs !== null && (
          <span className="text-xs text-muted-foreground">
            {semanticLatencyMs}ms
          </span>
        )}
    </div>
  );
}

interface DesktopBookmarksHeaderProps {
  currentFolderName?: string;
  CurrentFolderIcon?: ElementType;
  sidebarOpen: boolean;
  searchQuery: string;
  searchMode: SearchMode;
  isSemanticLoading: boolean;
  semanticStage: SemanticStage;
  semanticLatencyMs: number | null;
  onSearchChange: (value: string) => void;
  onToggleSidebar: () => void;
  addBookmarkButton: ReactNode;
}

export function DesktopBookmarksHeader({
  currentFolderName,
  CurrentFolderIcon,
  sidebarOpen,
  searchQuery,
  searchMode,
  isSemanticLoading,
  semanticStage,
  semanticLatencyMs,
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
      <SearchStatus
        searchMode={searchMode}
        isSemanticLoading={isSemanticLoading}
        semanticStage={semanticStage}
        semanticLatencyMs={semanticLatencyMs}
      />

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
  searchMode: SearchMode;
  isSemanticLoading: boolean;
  semanticStage: SemanticStage;
  semanticLatencyMs: number | null;
  onSearchChange: (value: string) => void;
  onToggleSearch: () => void;
  addBookmarkButton: ReactNode;
}

export function MobileBookmarksHeader({
  currentFolderName,
  CurrentFolderIcon,
  showMobileSearch,
  searchQuery,
  searchMode,
  isSemanticLoading,
  semanticStage,
  semanticLatencyMs,
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
          <div className="relative mb-2">
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
          <SearchStatus
            searchMode={searchMode}
            isSemanticLoading={isSemanticLoading}
            semanticStage={semanticStage}
            semanticLatencyMs={semanticLatencyMs}
          />
        </div>
      )}
    </>
  );
}
