"use client";

import { useMutation, useQuery } from "convex/react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@/convex/_generated/api";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePrivacyStore } from "@/hooks/use-privacy-store";
import { cn } from "@/lib/utils";
import { ProfileImageUpload } from "./profile-image-upload";
import { SectionHeader } from "./section-header";

export function ProfileSettings() {
  const isMobile = useIsMobile();
  const profile = useQuery(api.users.getProfile);
  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);

  const blurProfile = usePrivacyStore((state) => state.blurProfile);

  // Local state for form inputs to allow editing before saving
  const [formData, setFormData] = useState({
    name: "",
    email: "", // Read-only 
  });

  // Sync from profile when loaded
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name ?? "",
        email: profile.email ?? "",
      });
      // Sync store to persistent setting if available
      if (profile.blurProfile !== undefined) {
        usePrivacyStore.getState().setBlurProfile(profile.blurProfile);
      }
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile({
        name: formData.name,
      });
      toast.success("Profile updated");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    }
  };

  const handleImageChange = async (file: File) => {
    try {
      // 1. Get upload URL
      const postUrl = await generateUploadUrl();

      // 2. Upload file
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error(`Upload failed: ${result.statusText}`);
      }

      const { storageId } = await result.json();

      // 3. Update profile with storage ID
      await updateProfile({
        image: storageId,
      });

      toast.success("Profile image updated");
    } catch (error) {
      toast.error("Failed to upload image");
      console.error(error);
    }
  };

  const handleBlurChange = async (checked: boolean) => {
    usePrivacyStore.getState().setBlurProfile(checked); // Optimistic / Local sync
    await updateProfile({ blurProfile: checked });
  };

  if (profile === undefined) {
    return <div>Loading settings...</div>; // Simple loading state
  }

  // Determine avatar URL: prefer profile.image (which is resolved in backend) or fallback
  const avatarUrl = profile?.image || "/placeholder-avatar.jpg";

  return (
    <>
      <SectionHeader
        title="Profile"
        description="Manage your public profile and personal details."
        compact={isMobile}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          "flex flex-col sm:flex-row items-start",
          isMobile ? "gap-5" : "gap-8",
        )}
      >
        <ProfileImageUpload
          currentAvatar={avatarUrl}
          onImageChange={handleImageChange}
          fallbackText={profile?.name?.substring(0, 2).toUpperCase() || "JD"}
        />

        <div
          className={cn(
            "grid flex-1 w-full max-w-lg",
            isMobile ? "gap-4" : "gap-5",
          )}
        >
          <div className="grid gap-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="max-w-md"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className={cn("max-w-md bg-muted text-muted-foreground", blurProfile && "blur-sm")}
            />
          </div>
          <div className={isMobile ? "pt-0" : "pt-2"}>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>

          <div
            className={cn(
              "border-t border-sidebar-border/50",
              isMobile ? "pt-4 mt-1" : "pt-6 mt-2",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <Label htmlFor="blur-profile">Privacy Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Blur your name and email in the sidebar and other public
                  areas.
                </p>
              </div>
              <Switch
                id="blur-profile"
                checked={blurProfile}
                onCheckedChange={handleBlurChange}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
