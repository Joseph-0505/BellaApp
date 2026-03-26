import { useEffect, useState } from "react";
import {
  createAgendaAppointment,
  getAgendaData,
  updateAgendaAppointment,
} from "../services/agendaService";

export default function useAgendaData(currentDate) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState(0);
  const [hours, setHours] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        setErrorStatus(0);

        const data = await getAgendaData(currentDate);
        if (!active) return;

        setHours(data?.hours || []);
        setAppointments(data?.appointments || []);
        setClients(data?.clients || []);
        setServices(data?.services || []);
      } catch (err) {
        if (!active) return;

        setHours([]);
        setAppointments([]);
        setClients([]);
        setServices([]);
        setError(err.message || "Falha ao carregar a agenda.");
        setErrorStatus(err.status || 0);
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
  }, [currentDate, reloadKey]);

  async function createAppointment(input) {
    const result = await createAgendaAppointment(input);
    setReloadKey((current) => current + 1);
    return result;
  }

  async function updateAppointment(id, changes) {
    const currentAppointment = appointments.find((appointment) => appointment.id === id);
    if (!currentAppointment) {
      return false;
    }

    const result = await updateAgendaAppointment(currentAppointment, changes);
    setReloadKey((current) => current + 1);
    return result;
  }

  function refreshAgendaData() {
    setReloadKey((current) => current + 1);
  }

  return {
    clients,
    error,
    errorStatus,
    hours,
    loading,
    normalizedAppointments: appointments,
    services,
    createAppointment,
    refreshAgendaData,
    updateAppointment,
  };
}
