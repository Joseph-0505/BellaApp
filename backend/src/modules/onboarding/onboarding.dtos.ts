import { z } from "zod";
import { completeOnboardingBodySchema } from "./onboarding.schemas";

export type CompleteOnboardingRequestDto = z.infer<typeof completeOnboardingBodySchema>;

export type OnboardingStatusResponseDto = {
  completed: boolean;
  businessName: string;
  hasTeam: boolean;
  usesRooms: boolean;
  servicesCount: number;
  professionalsCount: number;
  roomsCount: number;
  defaultSchedule: {
    mondayToFriday: { start: string; end: string };
    saturday: { start: string; end: string };
    sunday: { closed: true };
  };
};

export type CompleteOnboardingResponseDto = OnboardingStatusResponseDto & {
  created: {
    professional: boolean;
    services: string[];
    rooms: string[];
  };
};
