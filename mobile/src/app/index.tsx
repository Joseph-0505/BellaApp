import { Redirect } from "expo-router";

import { ScreenLoader } from "../components/ScreenLoader";
import { useAuth } from "../hooks/useAuth";
import { getAuthenticatedEntryRoute } from "../utils/routes";

export default function Home() {
  const { bootstrapping, isAuthenticated, onboarding, onboardingLoading } =
    useAuth();

  if (bootstrapping || onboardingLoading) {
    return <ScreenLoader message="Preparando o app..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <Redirect href={getAuthenticatedEntryRoute(onboarding?.completed)} />;
}
