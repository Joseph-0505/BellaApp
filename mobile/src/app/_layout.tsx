import { router, Stack, useSegments } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { BottomNavigation } from "../components/BottomNavigation";
import { HomeHeader } from "../components/HomeHeader";
import { AuthProvider } from "../context/AuthContext";
import { useAuth } from "../hooks/useAuth";
import { PageActionProvider } from "../context/PageActionContext";
import { consumeSessionEndReason } from "../services/api";

function AppLayout() {
  const { bootstrapping, isAuthenticated } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (bootstrapping || isAuthenticated) return;

    const rootSegment = String(segments[0] || "");
    const isPublicRoute = !rootSegment
      || rootSegment === "login"
      || rootSegment === "cadastro";

    if (isPublicRoute) return;

    const reason = consumeSessionEndReason();
    router.replace({
      pathname: "/login",
      params: reason === "expired"
        ? { message: "Sua sessão expirou. Entre novamente." }
        : {},
    });
  }, [bootstrapping, isAuthenticated, segments]);

  return (
    <View style={{ flex: 1 }}>
      {isAuthenticated ? <HomeHeader /> : null}
      <Stack screenOptions={{ headerShown: false }} />
      {isAuthenticated ? <BottomNavigation /> : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PageActionProvider>
          <AppLayout />
        </PageActionProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
