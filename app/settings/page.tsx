import { SettingsPage } from "@/components/settings/settings-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Settings | Bookmarks",
    description: "Manage your account and application settings",
};

export default function Page() {
    return <SettingsPage />;
}
