import React from "react";

import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { colors } from "../../global/colors";
import { styles } from "./styles";

interface ProfileInfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  last?: boolean;
  value: string;
}

export function ProfileInfoRow({ icon, label, last = false, value }: ProfileInfoRowProps) {
  return (
    <View style={[styles.row, last ? null : styles.divider]}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={19} color={colors.primaryDark} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || "Não informado"}</Text>
      </View>
    </View>
  );
}
