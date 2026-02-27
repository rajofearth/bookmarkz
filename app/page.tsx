import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { isAuthenticated } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: { absolute: "Bukmarks" },
  description:
    "Organize and manage your bookmarks with ease. Save links, build folders, find anything. Simple and fast.",
};

export default async function Page() {
  const isAuth = await isAuthenticated();

  return <LandingPage isAuthenticated={isAuth} />;
}
