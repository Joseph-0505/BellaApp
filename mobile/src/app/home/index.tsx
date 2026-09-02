import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { AppointmentCard } from "../../components/AppointmentCard";
import { MetricCard } from "../../components/MetricCard";
import { ScreenLoader } from "../../components/ScreenLoader";
import { colors } from "../../global/colors";
import { useAuth } from "../../hooks/useAuth";
import { styles } from "../../styles/home.styles";
import { appointments } from "../../utils/appointments";
import { getAuthenticatedEntryRoute } from "../../utils/routes";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatCount(value: number) {
  return String(value).padStart(2, "0");
}

function getFirstName(name?: string) {
  return String(name || "Bella").trim().split(/\s+/)[0] || "Bella";
}

export default function HomeScreen() {
  const {
    bootstrapping,
    isAuthenticated,
    onboarding,
    onboardingLoading,
    user,
  } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());

  if (bootstrapping || onboardingLoading) {
    return <ScreenLoader message="Carregando painel..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!onboarding?.completed) {
    return <Redirect href={getAuthenticatedEntryRoute(false)} />;
  }

  const firstName = getFirstName(user?.name);
  const clinicName =
    user?.businessProfile?.businessName || onboarding.businessName || "BellaApp";
  const insightText =
    onboarding.servicesCount === 0
      ? "Cadastre o primeiro servico para liberar a agenda real da clinica."
      : "Sua clinica ja passou pelo setup minimo e esta pronta para operar.";

  function shiftDate(days: number) {
    setSelectedDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + days);
      return next;
    });
  }

  function showMessage(message: string) {
    Alert.alert("BellaApp", message);
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.welcome}>
        <Text style={styles.welcomeEyebrow}>Bom dia, {firstName}</Text>
        <Text style={styles.welcomeTitle}>{clinicName}</Text>
      </View>

      <Text style={styles.summary}>
        Sua configuracao inicial foi concluida. Confira abaixo o estado atual da
        clinica e siga com os primeiros cadastros.
      </Text>

      <View style={styles.metrics}>
        <MetricCard
          icon="briefcase-outline"
          label="Servicos"
          value={formatCount(onboarding.servicesCount)}
        />
        <MetricCard
          icon="people-outline"
          label="Profissionais"
          value={formatCount(onboarding.professionalsCount)}
          tone="green"
        />
        <MetricCard
          icon="business-outline"
          label="Salas"
          value={formatCount(onboarding.roomsCount)}
          tone="neutral"
        />
        <MetricCard
          icon="checkmark-circle-outline"
          label="Onboarding"
          value="OK"
          tone="green"
        />
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push("/agenda")}
        >
          <Ionicons name="add" size={21} color={colors.white} />
          <Text style={styles.quickActionText}>Novo agendamento</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickAction, styles.quickActionAlt]}
          onPress={() => showMessage("Fluxo de novo cliente em breve.")}
        >
          <Ionicons
            name="person-add-outline"
            size={19}
            color={colors.primaryDark}
          />
          <Text style={[styles.quickActionText, styles.quickActionAltText]}>
            Novo cliente
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.insight}>
        <View style={styles.insightIcon}>
          <Ionicons
            name="sparkles-outline"
            size={18}
            color={colors.primaryDark}
          />
        </View>
        <View style={styles.insightCopy}>
          <Text style={styles.insightTitle}>Proximo melhor passo</Text>
          <Text style={styles.insightText}>{insightText}</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Agenda demonstrativa</Text>
        <TouchableOpacity
          onPress={() => router.push("/agenda")}
        >
          <Text style={styles.link}>Ver tudo</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.dateRow}>
        <TouchableOpacity
          accessibilityLabel="Dia anterior"
          style={styles.dateButton}
          onPress={() => shiftDate(-1)}
        >
          <Ionicons
            name="chevron-back"
            size={17}
            color={colors.primaryDark}
          />
        </TouchableOpacity>
        <Text style={styles.dateLabel}>{formatDate(selectedDate)}</Text>
        <TouchableOpacity
          accessibilityLabel="Proximo dia"
          style={styles.dateButton}
          onPress={() => shiftDate(1)}
        >
          <Ionicons
            name="chevron-forward"
            size={17}
            color={colors.primaryDark}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.panel}>
        {appointments.map((appointment) => (
          <AppointmentCard
            key={`${appointment.time}-${appointment.client}`}
            {...appointment}
            onPress={() => showMessage(`Detalhes de ${appointment.client}.`)}
          />
        ))}
      </View>
    </ScrollView>
  );
}
