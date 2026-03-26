import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AgendaHeader from "../../components/agenda/AgendaHeader";
import AgendaWeekTable from "../../components/agenda/AgendaWeekTable";
import AgendaFilters from "../../components/agenda/AgendaFilters";
import AgendaSidebar from "../../components/agenda/AgendaSidebar";
import AppointmentModal from "../../components/modals/AppointmentModal";
import NovoAgendamento from "../../components/modals/NovoAgendamento";
import NovoCliente from "../../components/modals/NovoCliente";

import { clearSession } from "../../services/api";
import { createClient } from "../../services/clientService";
import useAgendaWeekNavigation from "../../hooks/useAgendaWeekNavigation";
import useAgendaData from "../../hooks/useAgendaData";
import useAgendaMetrics from "../../hooks/useAgendaMetrics";

import "../../styles/agenda/agenda.css";
import "../../styles/dashboard/agenda-table.css";

export default function AgendaPage() {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState("todos");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);

  const {
    currentDate,
    weekDays,
    nextWeek,
    prevWeek,
    goToday,
  } = useAgendaWeekNavigation();

  const {
    clients,
    error,
    errorStatus,
    loading,
    hours,
    normalizedAppointments,
    services,
    createAppointment,
    refreshAgendaData,
    updateAppointment,
  } = useAgendaData(currentDate);

  useEffect(() => {
    if (errorStatus === 401) {
      clearSession();
      navigate("/login", { replace: true });
    }
  }, [errorStatus, navigate]);

  const {
    hasFilters,
    resumoAgenda,
    livresAgora,
    visibleAppointmentIds,
    visibleAppointments,
    weekAppointments,
  } = useAgendaMetrics({
    appointments: normalizedAppointments,
    term,
    status,
    weekDays,
    hours,
  });

  const selectedAppointment = useMemo(
    () => normalizedAppointments.find((appointment) => appointment.id === selectedAppointmentId) || null,
    [normalizedAppointments, selectedAppointmentId]
  );

  function openModal(appointment) {
    setSelectedAppointmentId(appointment.id);
  }

  function closeModal() {
    setSelectedAppointmentId(null);
  }

  async function handleNewAppointment(appointment) {
    try {
      await createAppointment(appointment);
    } catch (requestError) {
      alert(requestError.message || "Não foi possivel criar o agendamento.");
      return false;
    }

    return true;
  }

  async function handleUpdateAppointment(id, changes) {
    try {
      await updateAppointment(id, changes);
    } catch (requestError) {
      alert(requestError.message || "Não foi possivel atualizar o agendamento.");
      return false;
    }

    return true;
  }

  async function handleNewClient(client) {
    try {
      await createClient(client);
      refreshAgendaData();
    } catch (requestError) {
      alert(requestError.message || "Não foi possivel criar o cliente.");
      return false;
    }

    return true;
  }

  return (
    <section className="dashboard-page">
      <AgendaHeader
        currentDate={currentDate}
        onNewClient={() => setIsNewClientOpen(true)}
        onNewAppointment={() => setIsNewAppointmentOpen(true)}
        onNextWeek={nextWeek}
        onPrevWeek={prevWeek}
        onToday={goToday}
      />

      <article className="panel">
        {loading ? <p className="agenda-feedback">Carregando agenda...</p> : null}
        {error ? <p className="agenda-feedback agenda-feedback-error">{error}</p> : null}

        {!loading && !error ? (
          <>
            <AgendaFilters
              term={term}
              setTerm={setTerm}
              status={status}
              setStatus={setStatus}
            />

            {hasFilters ? (
              <p className="agenda-feedback">
                Mostrando {visibleAppointments.length} de {weekAppointments.length} agendamentos
                desta semana. Os demais continuam ocupando seus horários na grade.
              </p>
            ) : null}

            <div className="agenda-layout-grid">
              <AgendaWeekTable
                appointments={weekAppointments}
                days={weekDays}
                filtersActive={hasFilters}
                hours={hours}
                onSelect={openModal}
                visibleAppointmentIds={visibleAppointmentIds}
              />

              <AgendaSidebar
                livresAgora={livresAgora}
                resumoAgenda={resumoAgenda}
              />

              <AppointmentModal
                appointment={selectedAppointment}
                appointments={normalizedAppointments}
                hours={hours}
                onClose={closeModal}
                onUpdate={handleUpdateAppointment}
              />
            </div>
          </>
        ) : null}
      </article>

      {isNewAppointmentOpen ? (
        <NovoAgendamento
          apiMode
          clients={clients}
          defaultDate={weekDays[0]?.key}
          hours={hours}
          onClose={() => setIsNewAppointmentOpen(false)}
          onSave={handleNewAppointment}
          services={services}
        />
      ) : null}

      {isNewClientOpen ? (
        <NovoCliente
          description="Cadastre um cliente sem sair da agenda para agilizar novos agendamentos."
          onClose={() => setIsNewClientOpen(false)}
          onSave={handleNewClient}
          showCommercialFields={false}
        />
      ) : null}
    </section>
  );
}
