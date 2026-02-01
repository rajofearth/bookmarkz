"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SocialButtons } from "./social-buttons";
import { authClient } from "@/lib/auth-client";

interface AuthFormProps {
    className?: string;
}

export function AuthForm({ className }: AuthFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSocialLogin = (provider: "google" | "github") => {
        setIsLoading(true);
        authClient.signIn.social({ provider });
    };

    return (
        <div className={cn("w-full max-w-sm space-y-6", className)}>
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Welcome back
                </h1>
                <p className="text-sm text-muted-foreground">
                    Sign in to your account to continue
                </p>
            </div>

            {/* Social Buttons */}
            <SocialButtons
                isLoading={isLoading}
                onGoogleClick={() => handleSocialLogin("google")}
                onGithubClick={() => handleSocialLogin("github")}
            />
        </div>
    );
}
