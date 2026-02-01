import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera } from "lucide-react";
import { SectionHeader } from "./section-header";

export function ProfileSettings() {
    const [user, setUser] = useState({
        name: "John Doe",
        email: "john@example.com",
        avatar: "/placeholder-avatar.jpg",
        bio: "Product Designer & Developer",
    });

    return (
        <>
            <SectionHeader
                title="Profile"
                description="Manage your public profile and personal details."
            />

            <div className="flex flex-col sm:flex-row gap-8 items-start">
                <div className="relative group shrink-0">
                    <Avatar className="size-32 border-4 border-sidebar-border/50">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-4xl bg-sidebar-accent text-sidebar-accent-foreground">
                            JD
                        </AvatarFallback>
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
        </>
    );
}
