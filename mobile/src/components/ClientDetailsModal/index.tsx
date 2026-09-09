import React from "react";

import { Ionicons } from "@expo/vector-icons";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../../global/colors";
import type { ClientProfile, ClientStatus } from "../../types/client";
import { formatCpf } from "../../utils/documents";
import { formatPhone } from "../../utils/phone";
import { RecordActions } from "../RecordActions";
import { Button } from "../Button";
import { styles } from "./styles";

const statusLabels: Record<ClientStatus, string> = {
  ativo: "Cliente ativo",
  inativo: "Cliente inativo",
  novo: "Novo cliente",
  risco: "Requer atenção",
};

const statusIcons: Record<ClientStatus, keyof typeof Ionicons.glyphMap> = {
  ativo: "checkmark-circle-outline",
  inativo: "pause-circle-outline",
  novo: "sparkles-outline",
  risco: "alert-circle-outline",
};

interface ClientDetailsModalProps {
  client: ClientProfile | null;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

interface DetailRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Nenhum registro";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
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

export function ClientDetailsModal({ client, onClose, onEdit, onDelete }: ClientDetailsModalProps) {
  const insets = useSafeAreaInsets();

  if (!client) {
    return null;
  }

  const appointmentLabel = client.nextAppointmentAt ? "Próximo atendimento" : "Última visita";
  const appointmentValue = formatDate(client.nextAppointmentAt || client.latestVisitAt);
  const notes = client.notes || client.latestVisitNote;

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
          accessibilityLabel="Fechar detalhes do cliente"
          style={styles.backdrop}
          onPress={onClose}
        />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 22) }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.eyebrow}>Detalhes do cliente</Text>
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

          <ScrollView
            bounces={false}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.identitySection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(client.name)}</Text>
              </View>
              <View style={styles.identityCopy}>
                <Text style={styles.name}>{client.name}</Text>
                <View style={[styles.statusBadge, styles[`${client.status}Badge`]]}>
                  <Ionicons
                    name={statusIcons[client.status]}
                    size={14}
                    color={
                      client.status === "ativo"
                        ? colors.success
                        : client.status === "risco"
                          ? "#9A6612"
                          : client.status === "novo"
                            ? colors.primaryDark
                            : colors.textSecondary
                    }
                  />
                  <Text style={[styles.statusText, styles[`${client.status}Text`]]}>
                    {statusLabels[client.status]}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Contato</Text>
            <View style={styles.detailsCard}>
              <DetailRow
                icon="call-outline"
                label="Telefone"
                value={formatPhone(client.phone) || client.phone || "Não informado"}
              />
              <View style={styles.rowDivider} />
              <DetailRow
                icon="mail-outline"
                label="E-mail"
                value={client.email || "Não informado"}
              />
              {client.cpf ? (
                <>
                  <View style={styles.rowDivider} />
                  <DetailRow icon="card-outline" label="CPF" value={formatCpf(client.cpf)} />
                </>
              ) : null}
            </View>

            <Text style={styles.sectionTitle}>Relacionamento</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Ionicons name="wallet-outline" size={20} color={colors.primaryDark} />
                <Text numberOfLines={1} style={styles.summaryValue}>
                  {formatCurrency(client.totalSpent)}
                </Text>
                <Text style={styles.summaryLabel}>Total investido</Text>
              </View>

              <View style={styles.summaryCard}>
                <Ionicons name="calendar-outline" size={20} color={colors.primaryDark} />
                <Text numberOfLines={1} style={styles.summaryValue}>
                  {appointmentValue}
                </Text>
                <Text style={styles.summaryLabel}>{appointmentLabel}</Text>
              </View>
            </View>

            {client.professional ? (
              <View style={styles.professionalCard}>
                <View style={styles.professionalIcon}>
                  <Ionicons name="person-outline" size={18} color={colors.primaryDark} />
                </View>
                <View style={styles.detailCopy}>
                  <Text style={styles.detailLabel}>Profissional responsável</Text>
                  <Text style={styles.detailValue}>{client.professional}</Text>
                </View>
              </View>
            ) : null}

            {notes ? (
              <View style={styles.notesCard}>
                <Ionicons name="document-text-outline" size={19} color={colors.primaryDark} />
                <View style={styles.detailCopy}>
                  <Text style={styles.detailLabel}>Observações</Text>
                  <Text style={styles.notesText}>{notes}</Text>
                </View>
              </View>
            ) : null}

            <RecordActions key={client.id} name={client.name} onEdit={onEdit} onDelete={onDelete} />
            <Button title="Fechar" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
