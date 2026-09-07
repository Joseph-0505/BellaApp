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
import type { ServiceProfile } from "../../types/service";
import { Button } from "../Button";
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

interface ServiceDetailsModalProps {
  onClose: () => void;
  service: ServiceProfile | null;
}

interface MetricProps {
  icon: IconName;
  label: string;
  value: string;
}

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

function Metric({ icon, label, value }: MetricProps) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>
        <Ionicons name={icon} size={18} color={colors.primaryDark} />
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.metricValue}>
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export function ServiceDetailsModal({ onClose, service }: ServiceDetailsModalProps) {
  const insets = useSafeAreaInsets();

  if (!service) {
    return null;
  }

  const icon = serviceIcons[service.icon] ?? "sparkles-outline";

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
          accessibilityLabel="Fechar detalhes do serviço"
          style={styles.backdrop}
          onPress={onClose}
        />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 22) }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.eyebrow}>Detalhes do serviço</Text>
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
              <View style={styles.serviceIcon}>
                <Ionicons name={icon} size={29} color={colors.primaryDark} />
              </View>
              <View style={styles.identityCopy}>
                <Text style={styles.name}>{service.name}</Text>
                <View style={styles.badges}>
                  <View
                    style={[
                      styles.badge,
                      service.active ? styles.activeBadge : styles.inactiveBadge,
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        service.active ? styles.activeDot : styles.inactiveDot,
                      ]}
                    />
                    <Text
                      style={[
                        styles.badgeText,
                        service.active ? styles.activeText : styles.inactiveText,
                      ]}
                    >
                      {service.active ? "Serviço ativo" : "Serviço inativo"}
                    </Text>
                  </View>

                  <View style={[styles.badge, styles[`${service.riskTone}Risk`]]}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={14}
                      color={
                        service.riskTone === "baixo"
                          ? colors.success
                          : service.riskTone === "medio"
                            ? "#9A6612"
                            : colors.error
                      }
                    />
                    <Text style={[styles.badgeText, styles[`${service.riskTone}RiskText`]]}>
                      Risco {service.riskLabel.toLowerCase()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Resumo</Text>
            <View style={styles.metricsRow}>
              <Metric icon="cash-outline" label="Preço" value={formatCurrency(service.price)} />
              <Metric
                icon="time-outline"
                label="Duração"
                value={formatDuration(service.durationMinutes)}
              />
              <Metric icon="bag-check-outline" label="Vendas" value={String(service.soldCount)} />
            </View>

            <Text style={styles.sectionTitle}>Descrição</Text>
            <View style={styles.descriptionCard}>
              <View style={styles.descriptionIcon}>
                <Ionicons name="document-text-outline" size={20} color={colors.primaryDark} />
              </View>
              <Text style={styles.description}>
                {service.description || "Nenhuma descrição cadastrada para este serviço."}
              </Text>
            </View>

            <Button title="Fechar" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
