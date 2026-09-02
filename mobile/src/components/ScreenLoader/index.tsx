import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { colors } from "../../global/colors";
import { styles } from "./styles";

interface ScreenLoaderProps {
  message?: string;
}

export function ScreenLoader({
  message = "Carregando...",
}: ScreenLoaderProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}
