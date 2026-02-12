import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewMode = "normal" | "compact" | "list" | "details";
export type SortMode = "newest" | "oldest";

interface GeneralSettingsState {
    openInNewTab: boolean;
    showFavicons: boolean;
    viewMode: ViewMode;
    sortMode: SortMode;
    updateSettings: (settings: Partial<{ openInNewTab: boolean; showFavicons: boolean; viewMode: ViewMode; sortMode: SortMode }>) => void;
}

export const useGeneralStore = create<GeneralSettingsState>()(
    persist(
        (set) => ({
            openInNewTab: true,
            showFavicons: true,
            viewMode: "normal",
            sortMode: "newest",
            updateSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
        }),
        {
            name: "bookmarks-settings",
        }
    )
);
