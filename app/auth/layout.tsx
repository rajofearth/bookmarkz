import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign In | Bookmarks",
    description: "Sign in to your Bookmarks account",
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background dark">
            {children}
        </div>
    );
}
