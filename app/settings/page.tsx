import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SettingsPage } from "@/components/settings/settings-page";
import { isAuthenticated } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "Settings | Bukmarks",
  description: "Manage your account and application settings",
};

export default async function Page() {
  const isAuth = await isAuthenticated();

  if (!isAuth) {
    redirect("/auth");
  }

  return <SettingsPage />;
}
