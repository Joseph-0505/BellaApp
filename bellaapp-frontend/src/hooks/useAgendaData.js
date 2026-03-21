import { useEffect, useMemo, useRef, useState } from "react";
import { getAgendaData } from "../services/agendaService";
import { normalizeDate } from "./useAgendaWeekNavigation";

export default function useAgendaData(currentDate) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hours, setHours] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const loadReferenceDateRef = useRef(currentDate);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const data = await getAgendaData();
        if (!active) return;

        setHours(data?.hours || []);
        setAppointments(data?.appointments || []);
      } catch (err) {
        if (!active) return;

        setHours([]);
        setAppointments([]);
        setError(err.message || "Falha ao carregar a agenda.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const normalizedAppointments = useMemo(() => {
    return appointments.map((appointment) => ({
      ...appointment,
      day: normalizeDate(appointment.day, loadReferenceDateRef.current),
    }));
  }, [appointments]);

  function updateAppointment(id, changes) {
    const patch = typeof changes === "string" ? { status: changes } : changes;

    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment.id === id ? { ...appointment, ...patch } : appointment
      )
    );
  }

  return { error, loading, hours, normalizedAppointments, updateAppointment };
}
