import type { Metadata } from "next";
import { RoadmapPage } from "@/components/landing/roadmap-page";
import { isAuthenticated } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "Upcoming features and improvements for Bukmarks.",
};

export default async function Page() {
  const isAuth = await isAuthenticated();
  return <RoadmapPage isAuthenticated={isAuth} />;
}
