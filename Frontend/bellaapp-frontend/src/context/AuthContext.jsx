import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { clearSession, getSession, isAuthenticated, SESSION_CHANGE_EVENT, updateSessionUser } from "../services/api";
import { getOnboardingStatus } from "../services/onboardingService";
import { getCurrentUserProfile } from "../services/userService";

export const AuthContext = createContext({
  bootstrapping: true,
  isAuthenticated: false,
  onboarding: null,
  onboardingLoading: false,
  refreshCurrentUser: async () => null,
  refreshOnboardingStatus: async () => null,
  session: null,
  user: null,
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getSession());
  const [onboarding, setOnboarding] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(() => isAuthenticated());
  const [onboardingLoading, setOnboardingLoading] = useState(() => isAuthenticated());

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    function syncSessionFromStorage() {
      setSession(getSession());
    }

    window.addEventListener(SESSION_CHANGE_EVENT, syncSessionFromStorage);
    return () => window.removeEventListener(SESSION_CHANGE_EVENT, syncSessionFromStorage);
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    if (!getSession()?.token) {
      return null;
    }

    try {
      const user = await getCurrentUserProfile();

      if (user) {
        updateSessionUser(user);
      }

      return user;
    } catch (requestError) {
      if (requestError?.status === 401) {
        clearSession();
      }

      throw requestError;
    }
  }, []);

  const refreshOnboardingStatus = useCallback(async () => {
    if (!getSession()?.token) {
      setOnboarding(null);
      setOnboardingLoading(false);
      return null;
    }

    try {
      const status = await getOnboardingStatus();
      setOnboarding(status);
      return status;
    } catch (requestError) {
      if (requestError?.status === 401) {
        clearSession();
        setOnboarding(null);
      }

      throw requestError;
    } finally {
      setOnboardingLoading(false);
    }
  }, []);

  useEffect(() => {
    const hasSession = Boolean(session?.token);

    if (!hasSession) {
      setOnboarding(null);
      setBootstrapping(false);
      setOnboardingLoading(false);
      return undefined;
    }

    let cancelled = false;

    setBootstrapping(true);
    setOnboardingLoading(true);

    Promise.all([refreshCurrentUser(), refreshOnboardingStatus()])
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setBootstrapping(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [refreshCurrentUser, refreshOnboardingStatus, session?.token]);

  const value = useMemo(
    () => ({
      bootstrapping,
      isAuthenticated: Boolean(session?.token),
      onboarding,
      onboardingLoading,
      refreshCurrentUser,
      refreshOnboardingStatus,
      session,
      user: session?.user || null,
    }),
    [bootstrapping, onboarding, onboardingLoading, refreshCurrentUser, refreshOnboardingStatus, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
