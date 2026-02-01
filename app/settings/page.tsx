import { SettingsPage } from "@/components/settings/settings-page";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Settings | Bookmarks",
    description: "Manage your account and application settings",
};

export default async function Page() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/auth");
    }

    return <SettingsPage />;
}
