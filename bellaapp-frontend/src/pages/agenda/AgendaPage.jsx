import { useMemo, useState } from "react";

import AgendaHeader from "../../components/agenda/AgendaHeader";
import AgendaWeekTable from "../../components/agenda/AgendaWeekTable";
import AgendaFilters from "../../components/agenda/AgendaFilters";
import AgendaSidebar from "../../components/agenda/AgendaSidebar";
import AppointmentModal from "../../components/modals/AppointmentModal";

import useAgendaWeekNavigation from "../../hooks/useAgendaWeekNavigation";
import useAgendaData from "../../hooks/useAgendaData";
import useAgendaMetrics from "../../hooks/useAgendaMetrics";

import "../../styles/agenda/agenda.css";
import "../../styles/dashboard/agenda-table.css";

export default function AgendaPage() {
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState("todos");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

  const {
    currentDate,
    weekDays,
    nextWeek,
    prevWeek,
    goToday,
  } = useAgendaWeekNavigation();

  const {
    error,
    loading,
    hours,
    normalizedAppointments,
    updateAppointment,
  } = useAgendaData(currentDate);

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
    () =>
      normalizedAppointments.find((appointment) => appointment.id === selectedAppointmentId) ||
      null,
    [normalizedAppointments, selectedAppointmentId]
  );

  function openModal(appointment) {
    setSelectedAppointmentId(appointment.id);
  }

  function closeModal() {
    setSelectedAppointmentId(null);
  }

  function focusAvailableSlots() {
    document
      .getElementById("agenda-available-slots")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="dashboard-page">
      <AgendaHeader
        currentDate={currentDate}
        onNewAppointment={focusAvailableSlots}
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
                desta semana. Os demais continuam ocupando seus horarios na grade.
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
                onUpdate={updateAppointment}
              />
            </div>
          </>
        ) : null}
      </article>
    </section>
  );
}
