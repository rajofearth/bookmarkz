"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
    ArrowLeft,
    User,
    Palette,
    Settings as SettingsIcon,
    Moon,
    Sun,
    Monitor,
    Camera,
    Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useSettings } from "@/components/settings-provider";
import { motion, AnimatePresence } from "motion/react";

export function SettingsPage() {
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const { settings, updateSettings } = useSettings();

    const [activeTab, setActiveTab] = useState("profile");
    // Mock User State
    const [user, setUser] = useState({
        name: "John Doe",
        email: "john@example.com",
        avatar: "/placeholder-avatar.jpg",
        bio: "Product Designer & Developer"
    });

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
            <Tabs defaultValue="profile" orientation="vertical" className="flex w-full h-full">
                {/* Sidebar */}
                <aside className="w-64 shrink-0 border-r bg-sidebar flex flex-col h-full z-10">
                    <div className="p-4 border-b border-sidebar-border">
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            onClick={() => router.push("/bookmarks")}
                        >
                            <ArrowLeft className="size-4" />
                            Back to Bookmarks
                        </Button>
                    </div>

                    <div className="p-4">
                        <div className="mb-4 px-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                            Settings
                        </div>
                        <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 gap-1">
                            <SettingsTabTrigger value="profile" icon={User} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                            <SettingsTabTrigger value="appearance" icon={Palette} label="Appearance" active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} />
                            <SettingsTabTrigger value="general" icon={SettingsIcon} label="General" active={activeTab === 'general'} onClick={() => setActiveTab('general')} />
                            <SettingsTabTrigger value="notifications" icon={Bell} label="Notifications" active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
                        </TabsList>
                    </div>

                    <div className="mt-auto p-4 border-t border-sidebar-border">
                        <div className="flex items-center gap-3 px-2 py-2">
                            <Avatar className="size-8">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">JD</AvatarFallback>
                            </Avatar>
                            <div className="text-sm min-w-0">
                                <p className="font-medium text-sidebar-foreground truncate">{user.name}</p>
                                <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto bg-background">
                    <div className="max-w-4xl mx-auto p-8 lg:p-12">
                        <AnimatePresence mode="wait">
                            {activeTab === 'profile' && (
                                <TabContentWrapper key="profile" value="profile">
                                    <SectionHeader title="Profile" description="Manage your public profile and personal details." />

                                    <div className="flex flex-col sm:flex-row gap-8 items-start">
                                        <div className="relative group shrink-0">
                                            <Avatar className="size-32 border-4 border-sidebar-border/50">
                                                <AvatarImage src={user.avatar} />
                                                <AvatarFallback className="text-4xl bg-sidebar-accent text-sidebar-accent-foreground">JD</AvatarFallback>
                                            </Avatar>
                                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                <Camera className="text-white size-8" />
                                            </div>
                                        </div>

                                        <div className="grid gap-5 flex-1 w-full max-w-lg">
                                            <div className="grid gap-2">
                                                <Label htmlFor="name">Display Name</Label>
                                                <Input
                                                    id="name"
                                                    value={user.name}
                                                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                                                    className="max-w-md"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={user.email}
                                                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                                                    className="max-w-md"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="bio">Bio</Label>
                                                <Input
                                                    id="bio"
                                                    value={user.bio}
                                                    onChange={(e) => setUser({ ...user, bio: e.target.value })}
                                                />
                                            </div>
                                            <div className="pt-2">
                                                <Button>Save Changes</Button>
                                            </div>
                                        </div>
                                    </div>
                                </TabContentWrapper>
                            )}

                            {activeTab === 'appearance' && (
                                <TabContentWrapper key="appearance" value="appearance">
                                    <SectionHeader title="Appearance" description="Customize the look and feel of the application." />

                                    <div className="space-y-4">
                                        <Label className="text-base">Theme</Label>
                                        <div className="grid grid-cols-3 gap-4 max-w-lg">
                                            <ThemeCard
                                                theme="light"
                                                active={theme === 'light'}
                                                onClick={() => setTheme('light')}
                                                icon={Sun}
                                                label="Light"
                                            />
                                            <ThemeCard
                                                theme="dark"
                                                active={theme === 'dark'}
                                                onClick={() => setTheme('dark')}
                                                icon={Moon}
                                                label="Dark"
                                            />
                                            <ThemeCard
                                                theme="system"
                                                active={theme === 'system'}
                                                onClick={() => setTheme('system')}
                                                icon={Monitor}
                                                label="System"
                                            />
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between max-w-2xl">
                                            <div className="space-y-0.5">
                                                <Label className="text-base">Reduced Motion</Label>
                                                <p className="text-sm text-muted-foreground">Reduce the amount of animations in the interface.</p>
                                            </div>
                                            <Switch />
                                        </div>
                                    </div>
                                </TabContentWrapper>
                            )}

                            {activeTab === 'general' && (
                                <TabContentWrapper key="general" value="general">
                                    <SectionHeader title="General" description="Configure general application settings." />

                                    <div className="space-y-6 max-w-2xl">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-base">Open links in new tab</Label>
                                                <p className="text-sm text-muted-foreground">Always open bookmarks in a new browser tab.</p>
                                            </div>
                                            <Switch
                                                checked={settings.openInNewTab}
                                                onCheckedChange={(checked) => updateSettings({ openInNewTab: checked })}
                                            />
                                        </div>
                                        <Separator />
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-base">Show favicons</Label>
                                                <p className="text-sm text-muted-foreground">Display website icons next to bookmark titles.</p>
                                            </div>
                                            <Switch
                                                checked={settings.showFavicons}
                                                onCheckedChange={(checked) => updateSettings({ showFavicons: checked })}
                                            />
                                        </div>
                                    </div>
                                </TabContentWrapper>
                            )}

                            {activeTab === 'notifications' && (
                                <TabContentWrapper key="notifications" value="notifications">
                                    <SectionHeader title="Notifications" description="Manage how you receive notifications." />
                                    <div className="p-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
                                        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                            <Bell className="size-6 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-medium">No notifications yet</h3>
                                        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">We'll let you know when something important happens with your bookmarks or account.</p>
                                    </div>
                                </TabContentWrapper>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </Tabs>
        </div>
    );
}

function SectionHeader({ title, description }: { title: string, description: string }) {
    return (
        <div className="space-y-1 mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
            <Separator className="mt-4" />
        </div>
    );
}

function SettingsTabTrigger({ value, icon: Icon, label, active, onClick }: { value: string, icon: any, label: string, active?: boolean, onClick?: () => void }) {
    return (
        <Button
            variant="ghost"
            onClick={onClick}
            className={cn(
                "w-full justify-start gap-3 px-3 py-2 h-9 rounded-md transition-all font-medium",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 dark:text-sidebar-foreground/60 hover:bg-sidebar-accent/50"
            )}
        >
            <Icon className="size-4" />
            {label}
        </Button>
    );
}

function TabContentWrapper({ children, value }: { children: React.ReactNode, value: string }) {
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

function ThemeCard({ theme, active, onClick, icon: Icon, label }: { theme: string, active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "cursor-pointer rounded-lg border-2 p-4 flex flex-col items-center gap-2 hover:bg-muted/50 transition-all",
                active ? "border-primary bg-muted/50" : "border-muted"
            )}
        >
            <div className={cn("rounded-full p-2", active ? "bg-primary text-primary-foreground" : "bg-muted")}>
                <Icon className="size-5" />
            </div>
            <span className="text-sm font-medium">{label}</span>
        </div>
    );
}
