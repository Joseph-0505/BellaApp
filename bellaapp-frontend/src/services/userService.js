import { apiGet, apiPut, getSession, setSession } from "./api";

const USERS_BASE_PATH = "/api/v1/users";

export async function getCurrentUserProfile() {
  const response = await apiGet(`${USERS_BASE_PATH}/me`);
  return response?.data || null;
}

export async function updateCurrentUserProfile(payload) {
  const response = await apiPut(`${USERS_BASE_PATH}/me`, payload);
  const updatedUser = response?.data || null;

  const currentSession = getSession();
  if (currentSession && updatedUser) {
    setSession({
      ...currentSession,
      user: updatedUser,
    });
  }

  return updatedUser;
}
