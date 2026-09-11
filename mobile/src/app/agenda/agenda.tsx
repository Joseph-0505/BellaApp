import React, { useCallback, useEffect, useState } from "react";

import { Ionicons } from "@expo/vector-icons";
import { Redirect, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { listAllPages } from "../../services/pagination";
import { PageAction } from "../../context/PageActionContext";
import { AppointmentDetailsModal, NewAppointmentModal } from "../../components/AppointmentModals";
import { listAppointments, createAppointment, updateAppointment, deleteAppointment, statusLabels, type Appointment, type NewAppointment } from "../../services/appointments";
import { listClients } from "../../services/clients";
import { listServices } from "../../services/services";
import { listProfessionals } from "../../services/professionals";
import type { ClientProfile } from "../../types/client";
import type { ServiceProfile } from "../../types/service";
import type { ProfessionalProfile } from "../../types/professional";
import { formatRequestError } from "../../utils/request-errors";
import { ScreenLoader } from "../../components/ScreenLoader";
import { colors } from "../../global/colors";
import { useAuth } from "../../hooks/useAuth";
import { styles } from "../../styles/agenda.styles";
import { getAuthenticatedEntryRoute } from "../../utils/routes";

const defaultHours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const weekdayLabels = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

function getWeekDates(reference: Date) {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());

  return weekdayLabels.map((label, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return { date, label };
  });
}

function isSameDay(left: Date, right: Date) {
  return left.toDateString() === right.toDateString();
}

export default function AgendaScreen(): React.JSX.Element {
  const { bootstrapping, isAuthenticated, onboarding, onboardingLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const params = useLocalSearchParams<{ create?: string }>();
  const [newVisible, setNewVisible] = useState(false);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [services, setServices] = useState<ServiceProfile[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [professionalFilter, setProfessionalFilter] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated || !onboarding?.completed) return;
    setLoading(true); setError("");
    try {
      const [a, c, s, p] = await Promise.all([listAppointments(), listAllPages(listClients), listAllPages(listServices), listAllPages(listProfessionals)]);
      setAppointments(a); setClients(c); setServices(s); setProfessionals(p);
      setLoaded(true);
    } catch (e) { setError(formatRequestError(e, "Não foi possível carregar a agenda.")); }
    finally { setLoading(false); }
  }, [isAuthenticated, onboarding?.completed]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useEffect(() => {
    if (params.create === "1" && loaded && !loading && !error && onboarding?.completed) {
      setNewVisible(true);
      router.setParams({ create: undefined });
    }
  }, [params.create, loaded, loading, error, onboarding?.completed]);

  const catalogs = { clients, services, professionals };
  const dayAppointments = appointments.filter(a => isSameDay(new Date(a.scheduledAt), selectedDate) && (!professionalFilter || a.professionalId === professionalFilter));
  const timeOf = (a: Appointment) => new Date(a.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const hours = [...new Set([...defaultHours, ...dayAppointments.map(timeOf)])].sort();
  async function saveAppointment(payload: NewAppointment) {
    const saved = editing ? await updateAppointment(editing.id, payload) : await createAppointment(payload);
    setAppointments(current => [...current.filter(a => a.id !== saved.id), saved]);
    setEditing(null);
    setSelectedDate(new Date(saved.scheduledAt));
    setProfessionalFilter("");
  }

  if (bootstrapping || onboardingLoading) {
    return <ScreenLoader message="Carregando agenda..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!onboarding?.completed) {
    return <Redirect href={getAuthenticatedEntryRoute(false)} />;
  }

  const weekDates = getWeekDates(selectedDate);
  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(selectedDate);

  function changeWeek(offset: number) {
    setSelectedDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + offset * 7);
      return next;
    });
  }

  return (
    <View style={styles.screen}>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.eyebrow}>Sua rotina</Text>
          <Text style={styles.title}>Agenda</Text>
        </View>
        <TouchableOpacity
          accessibilityLabel="Filtrar profissionais"
          style={styles.filterButton}
          onPress={() => setFilterVisible(value => !value)}
        >
          <Ionicons name="options-outline" size={21} color={colors.primaryDark} />
        </TouchableOpacity>
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.monthRow}>
          <TouchableOpacity
            accessibilityLabel="Semana anterior"
            style={styles.monthButton}
            onPress={() => changeWeek(-1)}
          >
            <Ionicons name="chevron-back" size={19} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity
            accessibilityLabel="Proxima semana"
            style={styles.monthButton}
            onPress={() => changeWeek(1)}
          >
            <Ionicons name="chevron-forward" size={19} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekRow}>
          {weekDates.map(({ date, label }) => {
            const selected = isSameDay(date, selectedDate);

            return (
              <TouchableOpacity
                key={date.toISOString()}
                accessibilityLabel={`${label}, ${date.getDate()}`}
                style={[styles.dayButton, selected ? styles.dayButtonSelected : null]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.weekday, selected ? styles.weekdaySelected : null]}>{label}</Text>
                <Text style={[styles.dayNumber, selected ? styles.dayNumberSelected : null]}>{date.getDate()}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {filterVisible ? <ScrollView horizontal style={{ maxHeight: 54 }} contentContainerStyle={{ padding: 8, gap: 8 }}>
        {[{ id: "", name: "Todos os profissionais" }, ...professionals].map(p => <TouchableOpacity key={p.id} onPress={() => { setProfessionalFilter(p.id); setFilterVisible(false); }} style={{ padding: 10, borderRadius: 10, backgroundColor: professionalFilter === p.id ? colors.primaryLight : colors.surface }}><Text>{p.name}</Text></TouchableOpacity>)}
      </ScrollView> : null}
      <View style={styles.toolbar}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Filtrar profissionais" onPress={() => setFilterVisible(value => !value)} style={styles.professionalFilter}>
          <Ionicons name="people-outline" size={17} color={colors.textSecondary} />
          <Text style={styles.professionalFilterText}>{professionals.find(p => p.id === professionalFilter)?.name || "Todos os profissionais"}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.dateDescription}>
          {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(selectedDate)}
        </Text>
      </View>

      {loading ? <Text style={{ padding: 16 }}>Atualizando agenda...</Text> : null}
      {error ? <TouchableOpacity onPress={() => void load()}><Text style={{ color: colors.error, padding: 16 }}>{error} Toque para tentar novamente.</Text></TouchableOpacity> : null}
      {!loading && !error && !dayAppointments.length ? <Text style={{ padding: 16, color: colors.textSecondary }}>Nenhum agendamento nesta data. Toque em + para agendar.</Text> : null}
      <ScrollView contentContainerStyle={styles.timeline} showsVerticalScrollIndicator={false}>
        {hours.map((hour) => {
          const slots = dayAppointments.filter(a => timeOf(a) === hour);

          return (
            <View key={hour} style={styles.timeSlot}>
              <Text style={styles.timeLabel}>{hour}</Text>
              <View style={styles.timeDivider} />
              <View style={[styles.appointmentArea, { gap: 8 }]}>
                {slots.map(appointment => (
                  <TouchableOpacity
                    key={appointment.id}
                    activeOpacity={0.8}
                    style={[
                      styles.appointmentCard,
                      appointment.status === "COMPLETED" ? styles.completedCard : null,
                      appointment.status === "CONFIRMED" ? styles.confirmedCard : null,
                      appointment.status === "SCHEDULED" ? styles.pendingCard : null,
                    ]}
                    onPress={() => setSelected(appointment)}
                  >
                    <View>
                      <Text style={styles.appointmentTitle}>{services.find(s => s.id === appointment.serviceId)?.name || "Serviço"}</Text>
                      <Text style={styles.clientName}>{clients.find(c => c.id === appointment.clientId)?.name || "Cliente"}</Text>
                    </View>
                    <Text
                      style={[
                        styles.appointmentStatus,
                        appointment.status === "COMPLETED" ? styles.completedText : null,
                        appointment.status === "CONFIRMED" ? styles.confirmedText : null,
                        appointment.status === "SCHEDULED" ? styles.pendingText : null,
                      ]}
                    >
                      {statusLabels[appointment.status]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {loaded && !loading && !error ? <PageAction label="Novo agendamento" onPress={() => { setEditing(null); setNewVisible(true); }} /> : null}
      <NewAppointmentModal appointment={editing} visible={newVisible} date={selectedDate} catalogs={{ clients, services: services.filter(s => s.active || s.id === editing?.serviceId), professionals: professionals.filter(p => p.status === "ativo" || p.id === editing?.professionalId) }} onClose={() => setNewVisible(false)} onSubmit={saveAppointment} />
      <AppointmentDetailsModal appointment={selected} catalogs={catalogs} onClose={() => setSelected(null)}
        onEdit={selected?.status !== "COMPLETED" ? () => { setEditing(selected); setSelected(null); setNewVisible(true); } : undefined}
        onDelete={async () => { if (!selected) return; await deleteAppointment(selected.id); setAppointments(current => current.filter(a => a.id !== selected.id)); setSelected(null); }} />
    </View>
  );
}
