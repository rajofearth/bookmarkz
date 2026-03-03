import type { LucideIcon } from "lucide-react";
import { Chrome, Github, Smartphone, Twitter } from "lucide-react";

export type RoadmapStatus = "done" | "in-progress" | "planned";

export const ROADMAP_ITEMS: {
  icon: LucideIcon;
  title: string;
  description: string;
  status: RoadmapStatus;
}[] = [
  {
    icon: Chrome,
    title: "Browser extension",
    description:
      "Available now. Save links from any page and import browser bookmarks with the Bukmarks extension.",
    status: "done",
  },
  {
    icon: Github,
    title: "GitHub Sync",
    description:
      "Sync your bookmarks to a GitHub repository. Version control, backup, and share your reading list.",
    status: "planned",
  },
  {
    icon: Smartphone,
    title: "Mobile app (iOS & Android)",
    description: "Coming soon to iOS and Android.",
    status: "planned",
  },
  {
    icon: Twitter,
    title: "Twitter Sync",
    description: "Sync your Twitter bookmarks to your Bukmarks account.",
    status: "planned",
  },
];
