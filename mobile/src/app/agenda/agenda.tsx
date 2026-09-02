import React, { useState } from "react";

import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { ScreenLoader } from "../../components/ScreenLoader";
import { colors } from "../../global/colors";
import { useAuth } from "../../hooks/useAuth";
import { styles } from "../../styles/agenda.styles";
import { getAuthenticatedEntryRoute } from "../../utils/routes";

type AppointmentTone = "completed" | "confirmed" | "pending";

type AgendaAppointment = {
  client: string;
  professional: string;
  service: string;
  time: string;
  tone: AppointmentTone;
};

const appointments: AgendaAppointment[] = [
  {
    client: "Carlos Andrade",
    professional: "Corte masculino",
    service: "Concluido",
    time: "09:00",
    tone: "completed",
  },
  {
    client: "Fernanda Lima",
    professional: "Coloracao",
    service: "Confirmado",
    time: "10:00",
    tone: "confirmed",
  },
  {
    client: "Juliana Souza",
    professional: "Escova progressiva",
    service: "Pendente",
    time: "11:00",
    tone: "pending",
  },
  {
    client: "Juliana Silva",
    professional: "Corte + escova",
    service: "Confirmado",
    time: "14:00",
    tone: "confirmed",
  },
  {
    client: "Rafael Oliveira",
    professional: "Barba",
    service: "Confirmado",
    time: "16:00",
    tone: "confirmed",
  },
];

const hours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
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

  function getAppointment(time: string) {
    return appointments.find((appointment) => appointment.time === time);
  }

  function openAppointment(appointment: AgendaAppointment) {
    Alert.alert(
      appointment.professional,
      `${appointment.client}\n${appointment.time} - ${appointment.service}`,
    );
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
          onPress={() => Alert.alert("Profissionais", "Filtro de profissionais em breve.")}
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

      <View style={styles.toolbar}>
        <View style={styles.professionalFilter}>
          <Ionicons name="people-outline" size={17} color={colors.textSecondary} />
          <Text style={styles.professionalFilterText}>Todos os profissionais</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
        </View>
        <Text style={styles.dateDescription}>
          {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(selectedDate)}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.timeline} showsVerticalScrollIndicator={false}>
        {hours.map((hour) => {
          const appointment = getAppointment(hour);

          return (
            <View key={hour} style={styles.timeSlot}>
              <Text style={styles.timeLabel}>{hour}</Text>
              <View style={styles.timeDivider} />
              <View style={styles.appointmentArea}>
                {appointment ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.appointmentCard,
                      appointment.tone === "completed" ? styles.completedCard : null,
                      appointment.tone === "confirmed" ? styles.confirmedCard : null,
                      appointment.tone === "pending" ? styles.pendingCard : null,
                    ]}
                    onPress={() => openAppointment(appointment)}
                  >
                    <View>
                      <Text style={styles.appointmentTitle}>{appointment.professional}</Text>
                      <Text style={styles.clientName}>{appointment.client}</Text>
                    </View>
                    <Text
                      style={[
                        styles.appointmentStatus,
                        appointment.tone === "completed" ? styles.completedText : null,
                        appointment.tone === "confirmed" ? styles.confirmedText : null,
                        appointment.tone === "pending" ? styles.pendingText : null,
                      ]}
                    >
                      {appointment.service}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        accessibilityLabel="Novo agendamento"
        style={styles.floatingButton}
        onPress={() => Alert.alert("Novo agendamento", "Formulario de agendamento em breve.")}
      >
        <Ionicons name="add" size={29} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}
