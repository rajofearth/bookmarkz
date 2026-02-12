import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BookmarksPage } from "@/components/bookmarks/bookmarks-page";
import { isAuthenticated } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "Bookmarks | Bukmarks",
  description: "View and manage your saved bookmarks",
};

export default async function Page() {
  const isAuth = await isAuthenticated();

  if (!isAuth) {
    redirect("/auth");
  }

  return (
    <Suspense fallback={null}>
      <BookmarksPage />
    </Suspense>
  );
}
