import { useEffect, useMemo, useState } from "react";

import AgendaHeader from "../../components/agenda/AgendaHeader";
import AgendaWeekTable from "../../components/agenda/AgendaWeekTable";
import SearchStatusFilters from "../../components/SearchStatusFilters";
import AgendaSidebar from "../../components/agenda/AgendaSidebar";
import AppointmentModal from "../../components/modals/AppointmentModal";
import NovoAgendamento from "../../components/modals/NovoAgendamento";
import NovoCliente from "../../components/modals/NovoCliente";
import ReagendamentoModal from "../../components/modals/ReagendamentoModal";
import { API_STATUS_OPTIONS } from "../../utils/StatusUtils";

import { getAgendaData as loadAgendaWeekData } from "../../services/agendaService";
import { createClient } from "../../services/clientService";
import useDisclosure from "../../hooks/useDisclosure";
import useUnauthorizedRedirect from "../../hooks/useUnauthorizedRedirect";
import useAgendaWeekNavigation from "../../hooks/useAgendaWeekNavigation";
import useAgendaData from "../../hooks/useAgendaData";
import useAgendaMetrics from "../../hooks/useAgendaMetrics";

import "../../styles/agenda/agenda.css";
import "../../styles/dashboard/agenda-table.css";

export default function AgendaPage() {
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState("todos");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [newAppointmentInitialValues, setNewAppointmentInitialValues] = useState({});
  const rescheduleModal = useDisclosure();
  const newAppointmentModal = useDisclosure();
  const newClientModal = useDisclosure();
  const redirectToLogin = useUnauthorizedRedirect();

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
      redirectToLogin();
    }
  }, [errorStatus, redirectToLogin]);

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
    rescheduleModal.close();
  }

  function closeModal() {
    setSelectedAppointmentId(null);
    rescheduleModal.close();
  }

  function openRescheduleModal() {
    rescheduleModal.open();
  }

  function returnToAppointmentModal() {
    rescheduleModal.close();
  }

  function openNewAppointment(slot = null) {
    setNewAppointmentInitialValues(
      slot
        ? {
            data: slot.day,
            hora: slot.hour,
          }
        : {}
    );
    newAppointmentModal.open();
  }

  function closeNewAppointment() {
    newAppointmentModal.close();
    setNewAppointmentInitialValues({});
  }

  async function handleNewAppointment(appointment) {
    try {
      await createAppointment(appointment);
    } catch (requestError) {
      alert(requestError.message || "Não foi possível criar o agendamento.");
      return false;
    }

    return true;
  }

  async function handleUpdateAppointment(id, changes) {
    try {
      await updateAppointment(id, changes);
    } catch (requestError) {
      alert(requestError.message || "Não foi possível atualizar o agendamento.");
      return false;
    }

    return true;
  }

  async function handleNewClient(client) {
    try {
      await createClient(client);
      refreshAgendaData();
    } catch (requestError) {
      alert(requestError.message || "Não foi possível criar o cliente.");
      return false;
    }

    return true;
  }

  const filterFeedback = hasFilters
    ? visibleAppointments.length > 0
      ? `Mostrando ${visibleAppointments.length} de ${weekAppointments.length} agendamentos desta semana. Os demais horários ficam ocultos pelo filtro.`
      : "Nenhum agendamento encontrado para os filtros atuais."
    : "";

  return (
    <section className="dashboard-page">
      <AgendaHeader
        currentDate={currentDate}
        onNewClient={newClientModal.open}
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
            <SearchStatusFilters
              searchValue={term}
              onSearchChange={setTerm}
              searchPlaceholder="Buscar cliente, serviço ou profissional"
              statusValue={status}
              onStatusChange={setStatus}
              statusOptions={API_STATUS_OPTIONS}
            />


            {hasFilters ? <p className="agenda-feedback">{filterFeedback}</p> : null}

            <div className="agenda-layout-grid">
              <AgendaWeekTable
                appointments={hasFilters ? visibleAppointments : weekAppointments}
                allAppointments={weekAppointments}
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

              {!rescheduleModal.isOpen ? (
                <AppointmentModal
                  appointment={selectedAppointment}
                  onClose={closeModal}
                  onRequestReschedule={openRescheduleModal}
                  onUpdate={handleUpdateAppointment}
                />
              ) : null}

              {rescheduleModal.isOpen ? (
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

      {newAppointmentModal.isOpen ? (
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

      {newClientModal.isOpen ? (
        <NovoCliente
          description="Cadastre um cliente sem sair da agenda para agilizar novos agendamentos."
          onClose={newClientModal.close}
          onSave={handleNewClient}
        />
      ) : null}
    </section>
  );
}
