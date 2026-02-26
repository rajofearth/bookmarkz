import { RoadmapPage } from "@/components/landing/roadmap-page";
import { isAuthenticated } from "@/lib/auth-server";

export default async function Page() {
  const isAuth = await isAuthenticated();
  return <RoadmapPage isAuthenticated={isAuth} />;
}
