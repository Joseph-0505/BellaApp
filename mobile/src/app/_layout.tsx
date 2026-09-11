import { Stack } from "expo-router";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { BottomNavigation } from "../components/BottomNavigation";
import { HomeHeader } from "../components/HomeHeader";
import { AuthProvider } from "../context/AuthContext";
import { useAuth } from "../hooks/useAuth";
import { PageActionProvider } from "../context/PageActionContext";

function AppLayout() {
  const { isAuthenticated } = useAuth();

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
        <PageActionProvider><AppLayout /></PageActionProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
