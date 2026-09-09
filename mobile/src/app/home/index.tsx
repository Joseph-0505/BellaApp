import React, { useCallback, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, router, useFocusEffect, type Href } from "expo-router";
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { AppointmentCard } from "../../components/AppointmentCard";
import { MetricCard } from "../../components/MetricCard";
import { ScreenLoader } from "../../components/ScreenLoader";
import { colors } from "../../global/colors";
import { useAuth } from "../../hooks/useAuth";
import { styles } from "../../styles/home.styles";
import { listAppointments, statusLabels, type Appointment } from "../../services/appointments";
import { listClients } from "../../services/clients";
import { listServices } from "../../services/services";
import { listProfessionals } from "../../services/professionals";
import type { ClientProfile } from "../../types/client";
import type { ServiceProfile } from "../../types/service";
import type { ProfessionalProfile } from "../../types/professional";
import { AppointmentDetailsModal } from "../../components/AppointmentModals";
import { formatRequestError } from "../../utils/request-errors";
import { getAuthenticatedEntryRoute } from "../../utils/routes";

async function listAll<T>(fetch: (params: { page: number; limit: number }) => Promise<{ data: T[]; meta: { total: number } }>) {
  const items: T[] = [];
  for (let page = 1; ; page++) {
    const response = await fetch({ page, limit: 100 });
    items.push(...response.data);
    if (!response.data.length || items.length >= response.meta.total) return items;
  }
}

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

  const [data, setData] = useState<{
    appointments: Appointment[]; clients: ClientProfile[]; services: ServiceProfile[]; professionals: ProfessionalProfile[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const requestId = useRef(0);
  const load = useCallback(async () => {
    if (!isAuthenticated || !onboarding?.completed) return;
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const [appointments, clients, services, professionals] = await Promise.all([
        listAppointments(), listAll(listClients), listAll(listServices), listAll(listProfessionals),
      ]);
      if (requestId.current === id) setData({ appointments, clients, services, professionals });
    } catch (e) {
      if (requestId.current === id) setError(formatRequestError(e, "Não foi possível atualizar o início."));
    } finally {
      if (requestId.current === id) setLoading(false);
    }
  }, [isAuthenticated, onboarding?.completed]);
  useFocusEffect(useCallback(() => {
    void load();
    return () => { requestId.current++; };
  }, [load]));

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
  const today = new Date();
  const dayAppointments = (data?.appointments || [])
    .filter(a => new Date(a.scheduledAt).toDateString() === selectedDate.toDateString())
    .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));
  const todayAppointments = (data?.appointments || []).filter(a =>
    new Date(a.scheduledAt).toDateString() === today.toDateString() && a.status !== "CANCELED");
  const activeServices = data?.services.filter(s => s.active).length || 0;
  const activeProfessionals = data?.professionals.filter(p => p.status === "ativo").length || 0;
  const insightText = !data ? "Carregue os dados para acompanhar sua clínica."
    : !data.clients.length ? "Cadastre seus clientes para começar a organizar os atendimentos."
    : !activeServices ? "Cadastre ou ative um serviço para criar agendamentos."
    : !activeProfessionals ? "Cadastre ou ative um profissional para receber agendamentos."
    : todayAppointments.length ? `Você tem ${todayAppointments.length} agendamento(s) hoje, sendo ${todayAppointments.filter(a => a.status === "CONFIRMED").length} confirmado(s) e ${todayAppointments.filter(a => a.status === "COMPLETED").length} concluído(s).`
    : "Sua agenda de hoje está livre. Use o botão + para criar um agendamento.";

  function shiftDate(days: number) {
    setSelectedDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + days);
      return next;
    });
  }


  return (
    <>
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={colors.primaryDark} colors={[colors.primaryDark]} />}
    >
      <View style={styles.welcome}>
        <Text style={styles.welcomeTitle}>Olá, {firstName}! 👋</Text>
        <Text style={styles.welcomeSubtitle}>Bem-vindo de volta ao AppBella</Text>
      </View>

      <Text style={styles.summary}>
        Acompanhe seus cadastros e atendimentos. Puxe para baixo para atualizar.
      </Text>

      {error ? <TouchableOpacity accessibilityRole="button" onPress={() => void load()} style={styles.insight}>
        <Text style={{ color: colors.error, flex: 1 }}>{error}{data ? " Exibindo a última atualização." : ""} Toque para tentar novamente.</Text>
      </TouchableOpacity> : null}
      {!data && loading ? <Text style={styles.empty}>Carregando informações...</Text> : null}
      <View style={styles.metrics}>
        <MetricCard
          icon="briefcase-outline"
          label="Serviços ativos"
          value={data ? formatCount(activeServices) : "—"}
        />
        <MetricCard
          icon="people-outline"
          label="Profissionais ativos"
          value={data ? formatCount(activeProfessionals) : "—"}
          tone="green"
        />
        <MetricCard
          icon="people-outline"
          label="Clientes cadastrados"
          value={data ? formatCount(data.clients.length) : "—"}
          tone="neutral"
        />
        <MetricCard
          icon="checkmark-circle-outline"
          label="Agendamentos hoje"
          value={data ? formatCount(todayAppointments.length) : "—"}
          tone="green"
        />
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push("/agenda?create=1" as Href)}
        >
          <Ionicons name="add" size={21} color={colors.white} />
          <Text style={styles.quickActionText}>Novo agendamento</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickAction, styles.quickActionAlt]}
          onPress={() => router.push("/clientes" as Href)}
        >
          <Ionicons
            name="person-add-outline"
            size={19}
            color={colors.primaryDark}
          />
          <Text style={[styles.quickActionText, styles.quickActionAltText]}>
            Ver clientes
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
          <Text style={styles.insightTitle}>Sua rotina</Text>
          <Text style={styles.insightText}>{insightText}</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Agendamentos do dia</Text>
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
        {!data ? <Text style={styles.empty}>Aguardando os dados da agenda.</Text> : !dayAppointments.length ? <Text style={styles.empty}>Nenhum agendamento nesta data.</Text> : null}
        {dayAppointments.map(appointment => (
          <AppointmentCard
            key={appointment.id}
            client={data?.clients.find(c => c.id === appointment.clientId)?.name || "Cliente indisponível"}
            service={data?.services.find(s => s.id === appointment.serviceId)?.name || "Serviço indisponível"}
            professional={data?.professionals.find(p => p.id === appointment.professionalId)?.name || "Profissional indisponível"}
            time={new Date(appointment.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            status={statusLabels[appointment.status]}
            onPress={() => setSelectedAppointment(appointment)}
          />
        ))}
      </View>
    </ScrollView>
    <AppointmentDetailsModal appointment={selectedAppointment} catalogs={data || { clients: [], services: [], professionals: [] }} onClose={() => setSelectedAppointment(null)} />
    </>
  );
}
