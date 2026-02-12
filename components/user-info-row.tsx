"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePrivacyStore } from "@/hooks/use-privacy-store";
import { cn } from "@/lib/utils";

interface UserInfoRowProps {
  user?: {
    name?: string;
    email?: string;
    image?: string | null;
    avatar?: string | null; // Handle both cases
  } | null;
  className?: string;
  avatarClassName?: string;
  showEmail?: boolean;
}

export function UserInfoRow({
  user,
  className,
  avatarClassName = "size-7",
  showEmail = true,
}: UserInfoRowProps) {
  const blurProfile = usePrivacyStore((state) => state.blurProfile);

  if (!user) {
    return (
      <div className={cn("flex items-center gap-2 px-2 py-2", className)}>
        <div
          className={cn(
            "rounded-full bg-sidebar-accent/20 animate-pulse",
            avatarClassName,
          )}
        />
        <div className="flex-1 space-y-1 min-w-0">
          <div className="h-3 w-20 rounded bg-sidebar-accent/20 animate-pulse" />
          {showEmail && (
            <div className="h-2 w-32 rounded bg-sidebar-accent/20 animate-pulse" />
          )}
        </div>
      </div>
    );
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const imageUrl = (user.image ?? user.avatar) || undefined;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2",
        className,
        blurProfile && "blur-sm",
      )}
    >
      <Avatar className={cn("shrink-0", avatarClassName)}>
        <AvatarImage src={imageUrl} />
        <AvatarFallback
          className={cn(
            "bg-sidebar-primary/10 text-sidebar-primary text-xs font-medium",
          )}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 text-left">
        <p
          className={cn(
            "truncate text-sm font-medium leading-tight text-sidebar-foreground",
          )}
        >
          {user.name}
        </p>
        {showEmail && (
          <p className={cn("truncate text-xs text-sidebar-foreground/60")}>
            {user.email}
          </p>
        )}
      </div>
    </div>
  );
}
