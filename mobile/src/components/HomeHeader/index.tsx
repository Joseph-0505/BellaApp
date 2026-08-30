import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { colors } from "../../global/colors";
import { styles } from "./styles";

interface HomeHeaderProps {
  clinicName: string;
  onNotificationPress: () => void;
  onProfilePress: () => void;
}

export function HomeHeader({ clinicName, onNotificationPress, onProfilePress }: HomeHeaderProps) {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.eyebrow}>Bom dia, Bella</Text>
        <Text style={styles.title}>{clinicName}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity accessibilityLabel="Notificações" style={styles.iconButton} onPress={onNotificationPress}>
          <Ionicons name="notifications-outline" size={21} color={colors.text} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
        <TouchableOpacity accessibilityLabel="Abrir perfil" style={styles.avatar} onPress={onProfilePress}>
          <Text style={styles.avatarText}>B</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
