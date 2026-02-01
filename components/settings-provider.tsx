"use client";

import * as React from "react";

interface Settings {
    openInNewTab: boolean;
    showFavicons: boolean;
}

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
    openInNewTab: true,
    showFavicons: true,
};

const SettingsContext = React.createContext<SettingsContextType | undefined>(
    undefined
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = React.useState<Settings>(defaultSettings);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        const savedSettings = localStorage.getItem("bookmarks-settings");
        if (savedSettings) {
            try {
                setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
            } catch (e) {
                console.error("Failed to parse settings", e);
            }
        }
        setMounted(true);
    }, []);

    const updateSettings = React.useCallback((newSettings: Partial<Settings>) => {
        setSettings((prev) => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem("bookmarks-settings", JSON.stringify(updated));
            return updated;
        });
    }, []);

    // Prevent hydration mismatch by rendering children only after mount, 
    // or just render but know that the initial state might differ.
    // Ideally for settings, we want to match server render if possible, 
    // but since it's local storage, we can't.
    // To avoid flicker, we can just render the provider. 
    // The 'mounted' check is useful if we want to show a loader or avoid hydration errors 
    // if the UI depends heavily on it on first render.
    // For 'showFavicons', it might cause a layout shift.
    // Let's just return children. 
    // Actually, to be safe with Next.js hydration, let's use the mounted check 
    // to avoid sending mismatched HTML if we were doing conditional rendering based on settings.
    // But here we are passing context.

    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = React.useContext(SettingsContext);
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
}
