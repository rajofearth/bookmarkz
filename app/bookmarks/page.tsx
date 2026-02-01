import { BookmarksPage } from "@/components/bookmarks/bookmarks-page";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
      const session = await auth.api.getSession({
          headers: await headers()
      });
  
      if (!session) {
          redirect("/auth");
      }
  
  return <BookmarksPage />;
}
