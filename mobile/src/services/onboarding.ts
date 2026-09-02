import type {
  CompleteOnboardingResponse,
  Nullable,
  OnboardingStatus,
} from "../types/auth";
import { apiGet, apiPost, unwrapData } from "./api";

const ONBOARDING_BASE_PATH = "/api/v1/onboarding";

interface CompleteOnboardingInput {
  businessName: string;
}

export function buildOnboardingPayload(input: CompleteOnboardingInput) {
  return {
    businessName: String(input.businessName || "").trim(),
  };
}

export async function getOnboardingStatus(): Promise<Nullable<OnboardingStatus>> {
  const response = await apiGet(`${ONBOARDING_BASE_PATH}/status`);
  return unwrapData<OnboardingStatus>(response);
}

export async function completeOnboarding(
  input: CompleteOnboardingInput,
): Promise<Nullable<CompleteOnboardingResponse>> {
  const response = await apiPost(
    `${ONBOARDING_BASE_PATH}/complete`,
    buildOnboardingPayload(input),
  );

  return unwrapData<CompleteOnboardingResponse>(response);
}
