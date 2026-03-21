import { useEffect, useMemo, useState } from "react";
import { getAgendaData } from "../services/agendaService";
import { normalizeDate } from "./useAgendaWeekNavigation";

export default function useAgendaData(currentDate) {
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState([]);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAgendaData();
        setHours(data?.hours || []);
        setAppointments(data?.appointments || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const normalizedAppointments = useMemo(() => {
    return appointments.map((a) => ({ ...a, day: normalizeDate(a.day, currentDate) }));
  }, [appointments, currentDate]);

  function updateAppointmentStatus(id, newStatus) {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
  }

  return { loading, hours, normalizedAppointments, updateAppointmentStatus };
}