import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PrivacyState {
    blurProfile: boolean;
    setBlurProfile: (value: boolean) => void;
}

export const usePrivacyStore = create<PrivacyState>()(
    persist(
        (set) => ({
            blurProfile: false,
            setBlurProfile: (value) => set({ blurProfile: value }),
        }),
        {
            name: "privacy-storage",
        }
    )
);
