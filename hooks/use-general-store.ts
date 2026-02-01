import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GeneralSettingsState {
    openInNewTab: boolean;
    showFavicons: boolean;
    updateSettings: (settings: Partial<{ openInNewTab: boolean; showFavicons: boolean }>) => void;
}

export const useGeneralStore = create<GeneralSettingsState>()(
    persist(
        (set) => ({
            openInNewTab: true,
            showFavicons: true,
            updateSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
        }),
        {
            name: "bookmarks-settings",
        }
    )
);
