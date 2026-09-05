import React from "react";

import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { colors } from "../../global/colors";
import type { ServiceProfile } from "../../types/service";
import { styles } from "./styles";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const serviceIcons: Record<string, IconName> = {
  drop: "water-outline",
  face: "happy-outline",
  flask: "flask-outline",
  leaf: "leaf-outline",
  lotus: "flower-outline",
  pulse: "pulse-outline",
  spark: "sparkles-outline",
  syringe: "medkit-outline",
  wand: "color-wand-outline",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(value);
}

function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}

interface ServiceCardProps {
  service: ServiceProfile;
  onPress: (service: ServiceProfile) => void;
}

export function ServiceCard({ service, onPress }: ServiceCardProps) {
  const icon = serviceIcons[service.icon] ?? "sparkles-outline";

  return (
    <TouchableOpacity
      accessibilityLabel={`Abrir serviço ${service.name}`}
      activeOpacity={0.78}
      style={[styles.card, !service.active ? styles.inactiveCard : null]}
      onPress={() => onPress(service)}
    >
      <View style={styles.topRow}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={23} color={colors.primaryDark} />
        </View>

        <View style={styles.mainCopy}>
          <Text numberOfLines={1} style={styles.name}>
            {service.name}
          </Text>
          <Text numberOfLines={2} style={styles.description}>
            {service.description || "Sem descrição cadastrada."}
          </Text>
        </View>

        <View style={[styles.status, service.active ? styles.activeStatus : styles.inactiveStatus]}>
          <View style={[styles.statusDot, service.active ? styles.activeDot : styles.inactiveDot]} />
          <Text style={[styles.statusText, service.active ? styles.activeText : styles.inactiveText]}>
            {service.active ? "Ativo" : "Inativo"}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.price}>{formatCurrency(service.price)}</Text>
          <Text style={styles.metricLabel}>Preço</Text>
        </View>

        <View style={styles.metricWithIcon}>
          <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
          <View>
            <Text style={styles.metricValue}>{formatDuration(service.durationMinutes)}</Text>
            <Text style={styles.metricLabel}>Duração</Text>
          </View>
        </View>

        <View style={styles.metric}>
          <View style={[styles.risk, styles[`${service.riskTone}Risk`]]}>
            <Text style={[styles.riskText, styles[`${service.riskTone}RiskText`]]}>
              {service.riskLabel}
            </Text>
          </View>
          <Text style={styles.metricLabel}>Risco</Text>
        </View>

        <View style={styles.soldBlock}>
          <Text style={styles.soldValue}>{service.soldCount}</Text>
          <Text style={styles.metricLabel}>Vendas</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
      </View>
    </TouchableOpacity>
  );
}
