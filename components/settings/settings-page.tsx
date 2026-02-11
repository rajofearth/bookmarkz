"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import {
    ArrowLeft,
    User,
    Palette,
    Settings as SettingsIcon,
    Bell,
    HardDriveDownload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "motion/react";
import { SettingsTabTrigger } from "./settings-tab-trigger";
import { ProfileSettings } from "./profile-settings";
import { AppearanceSettings } from "./appearance-settings";
import { GeneralSettings } from "./general-settings";
import { NotificationsSettings } from "./notifications-settings";
import { DataSettings } from "./data-settings";
import { UserInfoRow } from "@/components/user-info-row";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function SettingsPage() {
    const router = useRouter();
    const isMobile = useIsMobile();
    const [activeTab, setActiveTab] = useState("profile");

    const user = useQuery(api.users.getProfile);

    useEffect(() => {
        if (isMobile) {
            router.replace("/bookmarks?tab=profile");
        }
    }, [isMobile, router]);

    if (isMobile) {
        return null;
    }

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
            <Tabs
                defaultValue="profile"
                orientation="vertical"
                className="flex w-full h-full"
            >
                {/* Sidebar */}
                <aside className="w-64 shrink-0 border-r bg-sidebar flex flex-col h-full z-10">
                    <div className="p-4 border-b border-sidebar-border">
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            onClick={() => router.push("/bookmarks")}
                        >
                            <ArrowLeft className="size-4" />
                            Back to Bukmarks
                        </Button>
                    </div>

                    <div className="p-4">
                        <div className="mb-4 px-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                            Settings
                        </div>
                        <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 gap-1">
                            <SettingsTabTrigger
                                value="profile"
                                icon={User}
                                label="Profile"
                                active={activeTab === "profile"}
                                onClick={() => setActiveTab("profile")}
                            />
                            <SettingsTabTrigger
                                value="appearance"
                                icon={Palette}
                                label="Appearance"
                                active={activeTab === "appearance"}
                                onClick={() => setActiveTab("appearance")}
                            />
                            <SettingsTabTrigger
                                value="general"
                                icon={SettingsIcon}
                                label="General"
                                active={activeTab === "general"}
                                onClick={() => setActiveTab("general")}
                            />
                            <SettingsTabTrigger
                                value="notifications"
                                icon={Bell}
                                label="Notifications"
                                active={activeTab === "notifications"}
                                onClick={() => setActiveTab("notifications")}
                            />
                            <SettingsTabTrigger
                                value="data"
                                icon={HardDriveDownload}
                                label="Data"
                                active={activeTab === "data"}
                                onClick={() => setActiveTab("data")}
                            />
                        </TabsList>
                    </div>

                    <div className="mt-auto p-4 border-t border-sidebar-border">
                        <div className="flex items-center gap-2 px-2 py-2">
                            <UserInfoRow user={user} className="w-full" />
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto bg-background">
                    <div className="max-w-4xl mx-auto p-8 lg:p-12">
                        <AnimatePresence mode="wait">
                            {activeTab === "profile" && (
                                <TabContentWrapper key="profile">
                                    <ProfileSettings />
                                </TabContentWrapper>
                            )}

                            {activeTab === "appearance" && (
                                <TabContentWrapper key="appearance">
                                    <AppearanceSettings />
                                </TabContentWrapper>
                            )}

                            {activeTab === "general" && (
                                <TabContentWrapper key="general">
                                    <GeneralSettings />
                                </TabContentWrapper>
                            )}

                            {activeTab === "notifications" && (
                                <TabContentWrapper key="notifications">
                                    <NotificationsSettings />
                                </TabContentWrapper>
                            )}

                            {activeTab === "data" && (
                                <TabContentWrapper key="data">
                                    <DataSettings />
                                </TabContentWrapper>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </Tabs>
        </div>
    );
}

function TabContentWrapper({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-8 outline-none"
        >
            {children}
        </motion.div>
    );
}
