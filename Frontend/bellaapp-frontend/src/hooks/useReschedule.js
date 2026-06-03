import { useEffect, useMemo, useState } from "react";
import {
  formatWeekRangeLabel,
  getMonday,
  getWeekDays,
  toIsoLocal,
} from "./useAgendaWeekNavigation";
import { showWarningAlert } from "../utils/alerts";
import {
  buildDayHourKey,
  canAppointmentFitInSlots,
  createOccupiedSlotKeySet,
  getAppointmentDurationMinutes,
} from "../utils/timeUtils";

const DAY_LOADING_DELAY_MS = 180;

export default function useReschedule({
  appointment,
  onUpdate,
  onClose,
  appointments = [],
  hours = [],
  initialMode = "view",
  loadWeekData,
}) {
  const baseDate = useMemo(() => {
    if (!appointment?.day) {
      return new Date();
    }

    return new Date(`${appointment.day}T00:00:00`);
  }, [appointment?.day]);

  const [mode, setMode] = useState(initialMode);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedHour, setSelectedHour] = useState("");
  const [loading, setLoading] = useState(false);
  // Keep week navigation inside the existing hook so the modal stays driven by the same source of data.
  const [weekBaseDate, setWeekBaseDate] = useState(baseDate);
  const [weekAppointments, setWeekAppointments] = useState(appointments);
  const [weekHours, setWeekHours] = useState(hours);
  const [weekLoading, setWeekLoading] = useState(false);
  const [dayLoading, setDayLoading] = useState(false);

  const appointmentWeekKey = useMemo(() => toIsoLocal(getMonday(baseDate)), [baseDate]);
  const activeWeekKey = useMemo(() => toIsoLocal(getMonday(weekBaseDate)), [weekBaseDate]);
  const weekDays = useMemo(() => getWeekDays(weekBaseDate), [weekBaseDate]);
  const weekLabel = useMemo(() => formatWeekRangeLabel(weekBaseDate), [weekBaseDate]);

  useEffect(() => {
    setMode(initialMode);
    setSelectedDay("");
    setSelectedHour("");
    setLoading(false);
    setWeekLoading(false);
    setDayLoading(false);
    setWeekBaseDate(baseDate);
    setWeekAppointments(appointments);
    setWeekHours(hours);
  }, [appointment?.id, baseDate, initialMode]);

  useEffect(() => {
    if (activeWeekKey !== appointmentWeekKey) {
      return;
    }

    setWeekAppointments(appointments);
    setWeekHours(hours);
  }, [activeWeekKey, appointmentWeekKey, appointments, hours]);

  useEffect(() => {
    if (!appointment || activeWeekKey === appointmentWeekKey || !loadWeekData) {
      return;
    }

    let active = true;
    setWeekLoading(true);

    loadWeekData(weekBaseDate)
      .then((data) => {
        if (!active) {
          return;
        }

        setWeekAppointments(data?.appointments || []);
        setWeekHours(data?.hours || []);
      })
      .finally(() => {
        if (active) {
          setWeekLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [activeWeekKey, appointment, appointmentWeekKey, loadWeekData, weekBaseDate]);

  // Light feedback when the selected day changes, without adding a separate loading flow.
  useEffect(() => {
    if (!selectedDay) {
      setDayLoading(false);
      return;
    }

    setDayLoading(true);
    const timeoutId = window.setTimeout(() => setDayLoading(false), DAY_LOADING_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [selectedDay]);

  const allWeekFreeSlots = useMemo(() => {
    if (!appointment || weekHours.length === 0) {
      return [];
    }

    const busyKeys = createOccupiedSlotKeySet(weekAppointments, weekHours, {
      excludeId: appointment.id,
    });
    const durationMinutes = getAppointmentDurationMinutes(appointment);

    return weekDays
      .flatMap((day) => weekHours.map((hour) => ({ day: day.key, label: day.label, hour })))
      .filter((slot) =>
        canAppointmentFitInSlots({
          day: slot.day,
          hour: slot.hour,
          durationMinutes,
          slots: weekHours,
          occupiedSlotKeys: busyKeys,
        })
      );
  }, [appointment, weekAppointments, weekDays, weekHours]);

  const availableDays = useMemo(() => {
    return weekDays.map((day) => {
      const count = allWeekFreeSlots.filter((slot) => slot.day === day.key).length;
      return { ...day, count };
    });
  }, [weekDays, allWeekFreeSlots]);

  // Build all slot states from the current week data instead of rendering a separate list for each state.
  const daySlots = useMemo(() => {
    if (!selectedDay || weekHours.length === 0) {
      return [];
    }

    const freeSlotKeys = new Set(allWeekFreeSlots.map((slot) => buildDayHourKey(slot.day, slot.hour)));

    return weekHours.map((hour) => {
      const key = buildDayHourKey(selectedDay, hour);
      const isAvailable = freeSlotKeys.has(key);
      const isSelected = isAvailable && selectedHour === hour;

      return {
        day: selectedDay,
        hour,
        isAvailable,
        isSelected,
        status: isSelected ? "selected" : isAvailable ? "available" : "unavailable",
      };
    });
  }, [allWeekFreeSlots, selectedDay, selectedHour, weekHours]);

  useEffect(() => {
    if (!selectedDay || !selectedHour) {
      return;
    }

    const selectedSlot = daySlots.find((slot) => slot.hour === selectedHour);
    if (!selectedSlot?.isAvailable) {
      setSelectedHour("");
    }
  }, [daySlots, selectedDay, selectedHour]);

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
    setDayLoading(false);
  }

  function shiftWeek(daysToAdd) {
    setSelectedDay("");
    setSelectedHour("");
    setDayLoading(false);
    setWeekBaseDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + daysToAdd);
      next.setHours(0, 0, 0, 0);
      return next;
    });
  }

  function nextWeek() {
    shiftWeek(7);
  }

  function prevWeek() {
    shiftWeek(-7);
  }

  function selectSlot(day, hour) {
    const slot = daySlots.find((item) => item.day === day && item.hour === hour);
    if (!slot?.isAvailable) {
      return;
    }

    setSelectedDay(day);
    setSelectedHour(hour);
  }

  function selectDay(day) {
    setSelectedDay(day);
    setSelectedHour("");
  }

  async function saveReschedule() {
    if (!appointment || !onUpdate || loading) {
      return;
    }

    if (!selectedDay || !selectedHour) {
      await showWarningAlert("Selecione um horário.");
      return;
    }

    try {
      setLoading(true);
      const result = await onUpdate(appointment.id, {
        status: "pendente",
        day: selectedDay,
        hour: selectedHour,
      });

      if (result !== false) {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  }

  return {
    mode,
    availableDays,
    daySlots,
    selectedDay,
    selectedHour,
    loading,
    dayLoading,
    weekLoading,
    weekLabel,
    startReschedule,
    cancelReschedule,
    selectDay,
    selectSlot,
    saveReschedule,
    nextWeek,
    prevWeek,
  };
}
