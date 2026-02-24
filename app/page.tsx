import { LandingPage } from "@/components/landing/landing-page";
import { isAuthenticated } from "@/lib/auth-server";

export default async function Page() {
  const isAuth = await isAuthenticated();

  return <LandingPage isAuthenticated={isAuth} />;
}
