import { useState, useMemo } from "react";

export default function useReschedule({
  appointment,
  onUpdate,
  onClose,
  availableSlots = [],
}) {
  const filteredSlots = useMemo(() => {
    if (!appointment) return availableSlots;

    const sameDaySlots = availableSlots.filter(
      (slot) => slot.day === appointment.day
    );

    return sameDaySlots.length > 0 ? sameDaySlots : availableSlots;
  }, [availableSlots, appointment]);

  const [mode, setMode] = useState("view");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedHour, setSelectedHour] = useState("");
  const [loading, setLoading] = useState(false);

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
    selectedDay,
    selectedHour,
    loading,
    availableSlots: filteredSlots,
    startReschedule,
    cancelReschedule,
    selectSlot,
    saveReschedule,
  };
}