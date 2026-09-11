import React from "react";

import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../../global/colors";
import type {
  ProfessionalAccessStatus,
  ProfessionalProfile,
} from "../../types/professional";
import { formatPhone } from "../../utils/phone";
import { RecordActions } from "../RecordActions";
import { Button } from "../Button";
import { styles } from "./styles";

const accessLabels: Record<ProfessionalAccessStatus, string> = {
  active: "Acesso ativo",
  invite_expired: "Convite expirado",
  invite_pending: "Convite pendente",
  no_access: "Sem acesso",
};

interface ProfessionalDetailsModalProps {
  onEdit?: () => void;
  onDelete?: () => Promise<void>;
  onClose: () => void;
  professional: ProfessionalProfile | null;
}

interface DetailRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={19} color={colors.primaryDark} />
      </View>
      <View style={styles.detailCopy}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text selectable style={styles.detailValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export function ProfessionalDetailsModal({
  onClose,
  professional,
  onEdit,
  onDelete,
}: ProfessionalDetailsModalProps) {
  const insets = useSafeAreaInsets();

  if (!professional) {
    return null;
  }

  const isActive = professional.status === "ativo";
  const hasActiveAccess = professional.accessStatus === "active";
  const hasExpiredInvite = professional.accessStatus === "invite_expired";
  const phone = formatPhone(professional.phone) || professional.phone || "Não informado";

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Fechar detalhes do profissional"
          style={styles.backdrop}
          onPress={onClose}
        />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 22) }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.eyebrow}>Detalhes do profissional</Text>
            <TouchableOpacity
              accessibilityLabel="Fechar"
              accessibilityRole="button"
              activeOpacity={0.75}
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView>
          <View style={styles.identitySection}>
            <View style={[styles.avatar, styles[`${professional.tone}Avatar`]]}>
              <Text style={[styles.avatarText, styles[`${professional.tone}AvatarText`]]}>
                {professional.initials}
              </Text>
            </View>

            <View style={styles.identityCopy}>
              <Text style={styles.name}>{professional.name}</Text>
              <Text style={styles.specialty}>
                {professional.specialty || "Sem especialidade definida"}
              </Text>
            </View>
          </View>

          <View style={styles.badges}>
            <View style={[styles.badge, isActive ? styles.activeBadge : styles.inactiveBadge]}>
              <View
                style={[
                  styles.statusDot,
                  isActive ? styles.activeStatusDot : styles.inactiveStatusDot,
                ]}
              />
              <Text style={[styles.badgeText, isActive ? styles.activeText : styles.inactiveText]}>
                {isActive ? "Profissional ativo" : "Profissional inativo"}
              </Text>
            </View>

            <View
              style={[
                styles.badge,
                hasActiveAccess
                  ? styles.activeBadge
                  : hasExpiredInvite
                    ? styles.expiredBadge
                    : styles.pendingBadge,
              ]}
            >
              <Ionicons
                name={hasActiveAccess ? "shield-checkmark-outline" : "key-outline"}
                size={14}
                color={
                  hasActiveAccess
                    ? colors.success
                    : hasExpiredInvite
                      ? colors.error
                      : colors.primaryDark
                }
              />
              <Text
                style={[
                  styles.badgeText,
                  hasActiveAccess
                    ? styles.activeText
                    : hasExpiredInvite
                      ? styles.expiredText
                      : styles.pendingText,
                ]}
              >
                {accessLabels[professional.accessStatus]}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Contato</Text>
          <View style={styles.detailsCard}>
            <DetailRow icon="call-outline" label="Telefone" value={phone} />
            <View style={styles.rowDivider} />
            <DetailRow
              icon="mail-outline"
              label="E-mail"
              value={professional.email || "Não informado"}
            />
          </View>

          {onEdit && onDelete ? <RecordActions key={professional.id} name={professional.name} onEdit={onEdit} onDelete={onDelete} /> : null}
          <Button title="Fechar" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
