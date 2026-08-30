import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { colors } from "../../global/colors";
import { styles } from "./styles";

interface AppointmentCardProps {
  client: string;
  service: string;
  professional: string;
  time: string;
  status: string;
  onPress: () => void;
}

export function AppointmentCard({ client, service, professional, time, status, onPress }: AppointmentCardProps) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.timeColumn}>
        <Text style={styles.time}>{time}</Text>
        <View style={styles.timeLine} />
      </View>
      <View style={styles.content}>
        <View style={styles.heading}>
          <Text style={styles.client}>{client}</Text>
          <View style={styles.status}><View style={styles.statusDot} /><Text style={styles.statusText}>{status}</Text></View>
        </View>
        <Text style={styles.service}>{service}</Text>
        <View style={styles.meta}>
          <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.metaText}>{professional}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
    </TouchableOpacity>
  );
}
