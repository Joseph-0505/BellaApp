import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { colors } from "../../global/colors";
import { styles } from "./styles";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface MetricCardProps {
  label: string;
  value: string;
  icon: IconName;
  tone?: "primary" | "green" | "neutral";
}

export function MetricCard({ label, value, icon, tone = "primary" }: MetricCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.icon, styles[`${tone}Icon`]]}>
        <Ionicons name={icon} size={18} color={tone === "primary" ? colors.primaryDark : tone === "green" ? colors.success : colors.textSecondary} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
