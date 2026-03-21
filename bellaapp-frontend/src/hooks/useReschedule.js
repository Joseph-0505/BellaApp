import { useState, useMemo } from "react";
import {
  getWeekDays,
} from "./useAgendaWeekNavigation";

export default function useReschedule({
  appointment,
  onUpdate,
  onClose,
  appointments = [],
  hours = [],
}) {
  const [mode, setMode] = useState("view");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedHour, setSelectedHour] = useState("");
  const [loading, setLoading] = useState(false);

  const baseDate = useMemo(() => {
    if (!appointment?.day) return new Date();
    return new Date(appointment.day + "T00:00:00");
  }, [appointment]);

  const weekDays = useMemo(() => getWeekDays(baseDate), [baseDate]);

  const allWeekFreeSlots = useMemo(() => {
    if (!appointment || hours.length === 0) return [];

    const busyKeys = new Set(
      appointments
        .filter((a) => a.id !== appointment.id)
        .map((a) => a.day + "-" + a.hour)
    );

    return weekDays
      .flatMap((day) =>
        hours.map((hour) => ({ day: day.key, label: day.label, hour }))
      )
      .filter((slot) => !busyKeys.has(slot.day + "-" + slot.hour));
  }, [appointment, appointments, hours, weekDays]);

  const availableDays = useMemo(() => {
    return weekDays.map((day) => {
      const count = allWeekFreeSlots.filter((slot) => slot.day === day.key).length;
      return { ...day, count };
    });
  }, [weekDays, allWeekFreeSlots]);

  const daySlots = useMemo(() => {
    if (!selectedDay) return [];
    return allWeekFreeSlots.filter((slot) => slot.day === selectedDay);
  }, [allWeekFreeSlots, selectedDay]);

  function startReschedule() {
    setMode("reschedule");
    setSelectedDay("");
    setSelectedHour("");
  }

  function cancelReschedule() {
    setMode("view");
    setSelectedDay("");
    setSelectedHour("");
    setLoading(false);
  }

  function selectSlot(day, hour) {
    setSelectedDay(day);
    setSelectedHour(hour);
  }

  function selectDay(day) {
    setSelectedDay("");
    setSelectedHour("");
    setSelectedDay(day);
  }

  function saveReschedule() {
    if (!appointment || !onUpdate || loading) return;

    if (!selectedDay || !selectedHour) {
      alert("Selecione um horário.");
      return;
    }

    setLoading(true);

    onUpdate(appointment.id, {
      status: "pendente",
      day: selectedDay,
      hour: selectedHour,
    });

    setLoading(false);
    onClose();
  }

  return {
    mode,
    availableDays,
    daySlots,
    selectedDay,
    selectedHour,
    loading,
    startReschedule,
    cancelReschedule,
    selectDay,
    selectSlot,
    saveReschedule,
  };
}