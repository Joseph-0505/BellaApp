import React from "react";

import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { colors } from "../../global/colors";
import type {
  ProfessionalAccessStatus,
  ProfessionalProfile,
} from "../../types/professional";
import { formatPhone } from "../../utils/phone";
import { styles } from "./styles";

const accessLabels: Record<ProfessionalAccessStatus, string> = {
  active: "Acesso ativo",
  invite_expired: "Convite expirado",
  invite_pending: "Convite pendente",
  no_access: "Sem acesso",
};

interface ProfessionalCardProps {
  professional: ProfessionalProfile;
  onPress: (professional: ProfessionalProfile) => void;
}

export function ProfessionalCard({ professional, onPress }: ProfessionalCardProps) {
  const phoneDisplay = formatPhone(professional.phone) || professional.phone;

  return (
    <TouchableOpacity
      accessibilityLabel={`Abrir profissional ${professional.name}`}
      activeOpacity={0.78}
      style={[styles.card, professional.status === "inativo" ? styles.inactiveCard : null]}
      onPress={() => onPress(professional)}
    >
      <View style={styles.topRow}>
        <View style={[styles.avatar, styles[`${professional.tone}Avatar`]]}>
          <Text style={[styles.avatarText, styles[`${professional.tone}AvatarText`]]}>
            {professional.initials}
          </Text>
        </View>

        <View style={styles.identity}>
          <Text numberOfLines={1} style={styles.name}>
            {professional.name}
          </Text>
          <Text numberOfLines={1} style={styles.specialty}>
            {professional.specialty || "Sem especialidade"}
          </Text>
        </View>

        <View
          style={[
            styles.status,
            professional.status === "ativo" ? styles.activeStatus : styles.inactiveStatus,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              professional.status === "ativo" ? styles.activeDot : styles.inactiveDot,
            ]}
          />
          <Text
            style={[
              styles.statusText,
              professional.status === "ativo" ? styles.activeText : styles.inactiveText,
            ]}
          >
            {professional.status === "ativo" ? "Ativo" : "Inativo"}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.contacts}>
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
            <Text numberOfLines={1} style={styles.contactText}>
              {phoneDisplay}
            </Text>
          </View>
          {professional.email ? (
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={14} color={colors.textSecondary} />
              <Text numberOfLines={1} style={styles.contactText}>
                {professional.email}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.access, styles[`${professional.accessStatus}Access`]]}>
          <Ionicons
            name={professional.accessStatus === "active" ? "shield-checkmark-outline" : "key-outline"}
            size={13}
            color={
              professional.accessStatus === "active"
                ? colors.success
                : professional.accessStatus === "invite_expired"
                  ? colors.error
                  : colors.primaryDark
            }
          />
          <Text style={[styles.accessText, styles[`${professional.accessStatus}AccessText`]]}>
            {accessLabels[professional.accessStatus]}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
      </View>
    </TouchableOpacity>
  );
}
