import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewMode = "normal" | "compact" | "list" | "details";
export type SortMode = "newest" | "oldest";

interface GeneralSettingsState {
  openInNewTab: boolean;
  showFavicons: boolean;
  reducedMotion: boolean;
  semanticDtype: "q4" | "q8" | "fp32";
  semanticAutoIndexing: boolean;
  semanticSearchEnabled: boolean;
  viewMode: ViewMode;
  sortMode: SortMode;
  updateSettings: (
    settings: Partial<{
      openInNewTab: boolean;
      showFavicons: boolean;
      reducedMotion: boolean;
      semanticDtype: "q4" | "q8" | "fp32";
      semanticAutoIndexing: boolean;
      semanticSearchEnabled: boolean;
      viewMode: ViewMode;
      sortMode: SortMode;
    }>,
  ) => void;
}

export const useGeneralStore = create<GeneralSettingsState>()(
  persist(
    (set) => ({
      openInNewTab: true,
      showFavicons: true,
      reducedMotion: false,
      semanticDtype: "q4",
      semanticAutoIndexing: true,
      semanticSearchEnabled: true,
      viewMode: "normal",
      sortMode: "newest",
      updateSettings: (newSettings) =>
        set((state) => ({ ...state, ...newSettings })),
    }),
    {
      name: "bookmarks-settings",
    },
  ),
);
