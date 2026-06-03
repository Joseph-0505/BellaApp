import { useMemo } from "react";
import { buildDayHourKey, createOccupiedSlotKeySet } from "../utils/timeUtils";

function normalizeFilterValue(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function useAgendaMetrics({
  appointments,
  term,
  status,
  weekDays,
  hours,
}) {
  const weekKeys = useMemo(() => new Set(weekDays.map((day) => day.key)), [weekDays]);

  const weekAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const dayKey = appointment.day?.split("T")[0] || appointment.day;
      return weekKeys.has(dayKey);
    });
  }, [appointments, weekKeys]);

  const visibleAppointments = useMemo(() => {
    const normalizedTerm = normalizeFilterValue(term);

    return weekAppointments.filter((appointment) => {
      const searchableValues = [
        appointment.cliente,
        appointment.servico,
        appointment.profissional,
        appointment.status,
      ];
      const matchTerm =
        !normalizedTerm ||
        searchableValues.some((value) => normalizeFilterValue(value).includes(normalizedTerm));

      const matchStatus = status === "todos" || appointment.status === status;
      return matchTerm && matchStatus;
    });
  }, [status, term, weekAppointments]);

  const visibleAppointmentIds = useMemo(
    () => new Set(visibleAppointments.map((appointment) => appointment.id)),
    [visibleAppointments]
  );

  const resumoAgenda = useMemo(() => {
    const totalAtendimentos = weekAppointments.length;
    const receitaProjetada = weekAppointments.reduce(
      (acc, appointment) => acc + Number(appointment.valorEstimado || 0),
      0
    );
    const confirmados = weekAppointments.filter(
      (appointment) => appointment.status === "confirmado"
    ).length;
    const pendentes = weekAppointments.filter(
      (appointment) => appointment.status === "pendente"
    ).length;
    const totalSlots = weekDays.length * hours.length;
    const busySlotKeys = createOccupiedSlotKeySet(weekAppointments, hours);
    const livresTotal = Math.max(totalSlots - busySlotKeys.size, 0);
    const taxaOcupacao =
      totalSlots > 0 ? Math.round((busySlotKeys.size / totalSlots) * 100) : 0;

    return {
      confirmados,
      livresTotal,
      pendentes,
      receitaProjetada,
      taxaOcupacao,
      totalAtendimentos,
    };
  }, [hours.length, weekAppointments, weekDays.length]);

  const livresAgora = useMemo(() => {
    const busyKeys = createOccupiedSlotKeySet(weekAppointments, hours);

    return weekDays
      .flatMap((day) => hours.map((hour) => ({ day: day.key, label: day.label, hour })))
      .filter((slot) => !busyKeys.has(buildDayHourKey(slot.day, slot.hour)));
  }, [hours, weekAppointments, weekDays]);

  const hasFilters = Boolean((term || "").trim()) || status !== "todos";

  return {
    hasFilters,
    livresAgora,
    resumoAgenda,
    visibleAppointmentIds,
    visibleAppointments,
    weekAppointments,
  };
}
