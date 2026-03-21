import { useState } from "react";

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
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const {
    currentDate,
    weekDays,
    nextWeek,
    prevWeek,
    goToday,
  } = useAgendaWeekNavigation();

  const {
    loading,
    hours,
    normalizedAppointments,
    updateAppointmentStatus,
  } = useAgendaData(currentDate);

  const {
    filtered,
    resumoAgenda,
    livresAgora,
  } = useAgendaMetrics({
    appointments: normalizedAppointments,
    term,
    status,
    weekDays,
    hours,
  });

  function openModal(appointment) {
    setSelectedAppointment(appointment);
  }

  function closeModal() {
    setSelectedAppointment(null);
  }


  return (
    <section className="dashboard-page">
      <AgendaHeader
        currentDate={currentDate}
        onNextWeek={nextWeek}
        onPrevWeek={prevWeek}
        onToday={goToday}
      />

      <article className="panel">
        <AgendaFilters
          term={term}
          setTerm={setTerm}
          status={status}
          setStatus={setStatus}
        />

        <div className="agenda-layout-grid">
          <AgendaWeekTable
            days={weekDays}
            hours={hours}
            appointments={filtered}
            onSelect={openModal}
          />

          <AgendaSidebar
            livresAgora={livresAgora}
            resumoAgenda={resumoAgenda}
          />

          <AppointmentModal
            appointment={selectedAppointment}
            onClose={closeModal}
            onUpdate={updateAppointmentStatus}
            availableSlots={livresAgora}
          />
        </div>
      </article>
    </section>
  );
}