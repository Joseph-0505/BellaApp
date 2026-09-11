import React from "react";

import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { colors } from "../../global/colors";
import type { ClientProfile, ClientStatus } from "../../types/client";
import { formatPhone } from "../../utils/phone";
import { styles } from "./styles";

const statusLabels: Record<ClientStatus, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  novo: "Novo",
  risco: "Atenção",
};

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
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

interface ClientCardProps {
  client: ClientProfile;
  onPress: (client: ClientProfile) => void;
}

export function ClientCard({ client, onPress }: ClientCardProps) {
  const nextAppointment = client.nextAppointmentAt
    ? `Próximo atendimento em ${formatDate(client.nextAppointmentAt)}`
    : client.latestVisitAt
      ? `Última visita em ${formatDate(client.latestVisitAt)}`
      : "Nenhum atendimento registrado";

  return (
    <TouchableOpacity
      accessibilityLabel={`Abrir cliente ${client.name}`}
      activeOpacity={0.78}
      style={styles.card}
      onPress={() => onPress(client)}
    >
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(client.name)}</Text>
        </View>

        <View style={styles.identity}>
          <Text numberOfLines={1} style={styles.name}>
            {client.name}
          </Text>
          <View style={styles.phoneRow}>
            <Ionicons name="call-outline" size={13} color={colors.textSecondary} />
            <Text numberOfLines={1} style={styles.phone}>
              {formatPhone(client.phone)}
            </Text>
          </View>
        </View>

        <View style={[styles.status, styles[`${client.status}Status`]]}>
          <View style={[styles.statusDot, styles[`${client.status}Dot`]]} />
          <Text style={[styles.statusText, styles[`${client.status}Text`]]}>
            {statusLabels[client.status]}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.activity}>
          <Ionicons
            name={client.nextAppointmentAt ? "calendar-outline" : "time-outline"}
            size={15}
            color={colors.primaryDark}
          />
          <View style={styles.activityCopy}>
            <Text numberOfLines={1} style={styles.activityTitle}>
              {nextAppointment}
            </Text>
            {client.professional ? (
              <Text numberOfLines={1} style={styles.professional}>
                com {client.professional}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.valueBlock}>
          <Text style={styles.value}>{formatCurrency(client.totalSpent)}</Text>
          <Text style={styles.valueLabel}>Total</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
      </View>
    </TouchableOpacity>
  );
}
