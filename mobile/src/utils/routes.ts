import type { Href } from "expo-router";

export function getAuthenticatedEntryRoute(completed?: boolean | null): Href {
  return (completed ? "/home" : "/onboarding") as Href;
}
