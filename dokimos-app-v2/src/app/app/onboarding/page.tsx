import { redirect } from "next/navigation";

/** Onboarding lives at `/onboarding`; this avoids a bare 404 for `/app/onboarding`. */
export default function AppOnboardingRedirectPage() {
  redirect("/onboarding");
}
