import { BookmarksPage } from "@/components/bookmarks/bookmarks-page";
import { isAuthenticated } from "@/lib/auth-server";
import { redirect } from "next/navigation";

export default async function Page() {
    const isAuth = await isAuthenticated();

    if (!isAuth) {
        redirect("/auth");
    }

    return <BookmarksPage />;
}