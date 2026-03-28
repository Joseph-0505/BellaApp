import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AgendaHeader from "../../components/agenda/AgendaHeader";
import AgendaWeekTable from "../../components/agenda/AgendaWeekTable";
import AgendaFilters from "../../components/agenda/AgendaFilters";
import AgendaSidebar from "../../components/agenda/AgendaSidebar";
import AppointmentModal from "../../components/modals/AppointmentModal";
import NovoAgendamento from "../../components/modals/NovoAgendamento";
import NovoCliente from "../../components/modals/NovoCliente";
import ReagendamentoModal from "../../components/modals/ReagendamentoModal";

import { clearSession } from "../../services/api";
import { getAgendaData as loadAgendaWeekData } from "../../services/agendaService";
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
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [newAppointmentInitialValues, setNewAppointmentInitialValues] = useState({});

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
    professionals,
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
    setIsRescheduleOpen(false);
  }

  function closeModal() {
    setSelectedAppointmentId(null);
    setIsRescheduleOpen(false);
  }

  function openRescheduleModal() {
    setIsRescheduleOpen(true);
  }

  function returnToAppointmentModal() {
    setIsRescheduleOpen(false);
  }

  // Reuse the existing modal and only prefill the slot when the user starts from an empty cell.
  function openNewAppointment(slot = null) {
    setNewAppointmentInitialValues(
      slot
        ? {
            data: slot.day,
            hora: slot.hour,
          }
        : {}
    );
    setIsNewAppointmentOpen(true);
  }

  function closeNewAppointment() {
    setIsNewAppointmentOpen(false);
    setNewAppointmentInitialValues({});
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
        onNewAppointment={() => openNewAppointment()}
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
                onCreate={openNewAppointment}
                onSelect={openModal}
                visibleAppointmentIds={visibleAppointmentIds}
              />

              <AgendaSidebar
                livresAgora={livresAgora}
                resumoAgenda={resumoAgenda}
              />

              {!isRescheduleOpen ? (
                <AppointmentModal
                  appointment={selectedAppointment}
                  onClose={closeModal}
                  onRequestReschedule={openRescheduleModal}
                  onUpdate={handleUpdateAppointment}
                />
              ) : null}

              {isRescheduleOpen ? (
                <ReagendamentoModal
                  appointment={selectedAppointment}
                  appointments={normalizedAppointments}
                  hours={hours}
                  loadWeekData={loadAgendaWeekData}
                  onBack={returnToAppointmentModal}
                  onClose={closeModal}
                  onUpdate={handleUpdateAppointment}
                />
              ) : null}
            </div>
          </>
        ) : null}
      </article>

      {isNewAppointmentOpen ? (
        <NovoAgendamento
          clients={clients}
          defaultDate={weekDays[0]?.key}
          hours={hours}
          initialValues={newAppointmentInitialValues}
          onClose={closeNewAppointment}
          onSave={handleNewAppointment}
          professionals={professionals}
          services={services}
        />
      ) : null}

      {isNewClientOpen ? (
        <NovoCliente
          description="Cadastre um cliente sem sair da agenda para agilizar novos agendamentos."
          onClose={() => setIsNewClientOpen(false)}
          onSave={handleNewClient}
        />
      ) : null}
    </section>
  );
}
