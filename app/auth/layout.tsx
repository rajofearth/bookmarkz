import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign In | Bukmarks",
    description: "Sign in to your Bukmarks account",
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
