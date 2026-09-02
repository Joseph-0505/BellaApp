import { Stack } from "expo-router";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { HomeHeader } from "../components/HomeHeader";
import { AuthProvider } from "../context/AuthContext";
import { useAuth } from "../hooks/useAuth";

function AppLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <View style={{ flex: 1 }}>
      {isAuthenticated ? <HomeHeader /> : null}
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
