import { apiGet, apiPost } from "./api";

const BILLING_BASE_PATH = "/api/v1/billing";

export async function getCurrentPlan() {
  const response = await apiGet(BILLING_BASE_PATH);
  return response?.data || null;
}

export async function upgradePlan(plan) {
  const response = await apiPost(`${BILLING_BASE_PATH}/upgrade`, { plan });
  return response?.data || null;
}

export function getTrialDaysRemaining(trialEndsAt) {
  if (!trialEndsAt) {
    return 0;
  }

  const trialEnd = new Date(trialEndsAt);
  if (Number.isNaN(trialEnd.getTime())) {
    return 0;
  }

  const millisecondsRemaining = trialEnd.getTime() - Date.now();
  if (millisecondsRemaining <= 0) {
    return 0;
  }

  return Math.ceil(millisecondsRemaining / (24 * 60 * 60 * 1000));
}
