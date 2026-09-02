import type { PropsWithChildren } from "react";
import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";

import { loginAndStoreSession, logout, type LoginCredentials } from "../services/auth";
import {
  clearSession,
  getSession,
  isAuthenticated,
  subscribeToSessionChanges,
  updateSessionUser,
} from "../services/api";
import {
  completeOnboarding as completeOnboardingRequest,
  getOnboardingStatus,
} from "../services/onboarding";
import { getCurrentUserProfile } from "../services/user";
import type {
  AuthSession,
  CompleteOnboardingResponse,
  Nullable,
  OnboardingStatus,
  UserProfile,
} from "../types/auth";

interface CompleteOnboardingInput {
  businessName: string;
}

interface AuthContextValue {
  bootstrapping: boolean;
  completeInitialOnboarding: (
    input: CompleteOnboardingInput,
  ) => Promise<Nullable<CompleteOnboardingResponse>>;
  isAuthenticated: boolean;
  onboarding: Nullable<OnboardingStatus>;
  onboardingLoading: boolean;
  refreshCurrentUser: () => Promise<Nullable<UserProfile>>;
  refreshOnboardingStatus: () => Promise<Nullable<OnboardingStatus>>;
  session: Nullable<AuthSession>;
  signIn: (credentials: LoginCredentials) => Promise<Nullable<OnboardingStatus>>;
  signOut: () => Promise<void>;
  user: Nullable<UserProfile>;
}

const defaultValue: AuthContextValue = {
  bootstrapping: false,
  completeInitialOnboarding: async () => null,
  isAuthenticated: false,
  onboarding: null,
  onboardingLoading: false,
  refreshCurrentUser: async () => null,
  refreshOnboardingStatus: async () => null,
  session: null,
  signIn: async () => null,
  signOut: async () => undefined,
  user: null,
};

export const AuthContext = createContext<AuthContextValue>(defaultValue);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Nullable<AuthSession>>(() => getSession());
  const [onboarding, setOnboarding] = useState<Nullable<OnboardingStatus>>(null);
  const [bootstrapping, setBootstrapping] = useState(() => isAuthenticated());
  const [onboardingLoading, setOnboardingLoading] = useState(() => isAuthenticated());

  useEffect(() => subscribeToSessionChanges(setSession), []);

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
      if (
        requestError
        && typeof requestError === "object"
        && "status" in requestError
        && requestError.status === 401
      ) {
        clearSession();
      }

      throw requestError;
    }
  }, []);

  const fetchOnboardingStatus = useCallback(async () => {
    if (!getSession()?.token) {
      setOnboarding(null);
      return null;
    }

    try {
      const status = await getOnboardingStatus();
      setOnboarding(status);
      return status;
    } catch (requestError) {
      if (
        requestError
        && typeof requestError === "object"
        && "status" in requestError
        && requestError.status === 401
      ) {
        clearSession();
        setOnboarding(null);
      }

      throw requestError;
    }
  }, []);

  const refreshOnboardingStatus = useCallback(async () => {
    setOnboardingLoading(true);

    try {
      return await fetchOnboardingStatus();
    } finally {
      setOnboardingLoading(false);
    }
  }, [fetchOnboardingStatus]);

  const loadSessionData = useCallback(async () => {
    if (!getSession()?.token) {
      setOnboarding(null);
      setOnboardingLoading(false);
      setBootstrapping(false);
      return {
        onboarding: null,
        user: null,
      };
    }

    setBootstrapping(true);
    setOnboardingLoading(true);

    try {
      const [userResult, onboardingResult] = await Promise.allSettled([
        refreshCurrentUser(),
        fetchOnboardingStatus(),
      ]);
      const user = userResult.status === "fulfilled" ? userResult.value : null;
      const onboardingStatus =
        onboardingResult.status === "fulfilled" ? onboardingResult.value : null;

      if (userResult.status === "rejected") {
        console.warn("Failed to load current user after sign-in.", userResult.reason);
      }

      if (onboardingResult.status === "rejected") {
        console.warn("Failed to load onboarding status after sign-in.", onboardingResult.reason);
      }

      return {
        onboarding: onboardingStatus,
        user,
      };
    } finally {
      setOnboardingLoading(false);
      setBootstrapping(false);
    }
  }, [fetchOnboardingStatus, refreshCurrentUser]);

  useEffect(() => {
    if (!getSession()?.token) {
      setBootstrapping(false);
      setOnboardingLoading(false);
      return;
    }

    void loadSessionData();
  }, [loadSessionData]);

  const signIn = useCallback(
    async (credentials: LoginCredentials) => {
      const nextSession = await loginAndStoreSession(credentials);

      if (!nextSession?.token) {
        return null;
      }

      const result = await loadSessionData();
      return result.onboarding;
    },
    [loadSessionData],
  );

  const signOut = useCallback(async () => {
    await logout();
    setOnboarding(null);
    setOnboardingLoading(false);
    setBootstrapping(false);
  }, []);

  const completeInitialOnboarding = useCallback(
    async (input: CompleteOnboardingInput) => {
      const result = await completeOnboardingRequest(input);

      if (result) {
        setOnboarding(result);
        await refreshCurrentUser();
      }

      return result;
    },
    [refreshCurrentUser],
  );

  const value = useMemo(
    () => ({
      bootstrapping,
      completeInitialOnboarding,
      isAuthenticated: Boolean(session?.token),
      onboarding,
      onboardingLoading,
      refreshCurrentUser,
      refreshOnboardingStatus,
      session,
      signIn,
      signOut,
      user: session?.user || null,
    }),
    [
      bootstrapping,
      completeInitialOnboarding,
      onboarding,
      onboardingLoading,
      refreshCurrentUser,
      refreshOnboardingStatus,
      session,
      signIn,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
