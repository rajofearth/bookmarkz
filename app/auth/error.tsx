"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Auth route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        We couldn&apos;t load the sign-in page. Please try again.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} variant="outline">
          Try again
        </Button>
        <Button asChild variant="default">
          <Link href="/auth">Back to Sign In</Link>
        </Button>
      </div>
    </div>
  );
}
