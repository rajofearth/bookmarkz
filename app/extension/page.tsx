import type { Metadata } from "next";
import { ExtensionPage } from "@/components/landing/extension-page";
import { isAuthenticated } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "Extension",
  description:
    "Install the Bukmarks browser extension for quick page saves and bookmark import.",
};

export default async function Page() {
  const isAuth = await isAuthenticated();
  return <ExtensionPage isAuthenticated={isAuth} />;
}
