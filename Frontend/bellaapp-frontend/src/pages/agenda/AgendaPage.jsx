import { useEffect, useMemo, useState } from "react";

import AgendaHeader from "../../components/agenda/AgendaHeader";
import AgendaWeekTable from "../../components/agenda/AgendaWeekTable";
import SearchStatusFilters from "../../components/SearchStatusFilters";
import AppointmentModal from "../../components/modals/AppointmentModal";
import AppointmentPaymentModal from "../../components/modals/AppointmentPaymentModal";
import NovoAgendamento from "../../components/modals/NovoAgendamento";
import NovoCliente from "../../components/modals/NovoCliente";
import ReagendamentoModal from "../../components/modals/ReagendamentoModal";
import { API_STATUS_OPTIONS } from "../../utils/StatusUtils";

import { completeAppointment, getAgendaData as loadAgendaWeekData } from "../../services/appointmentService";
import { createClient } from "../../services/clientService";
import { payBilling } from "../../services/cashService";
import useDisclosure from "../../hooks/useDisclosure";
import useUnauthorizedRedirect from "../../hooks/useUnauthorizedRedirect";
import useAgendaWeekNavigation from "../../hooks/useAgendaWeekNavigation";
import useAgendaData from "../../hooks/useAgendaData";
import useAgendaMetrics from "../../hooks/useAgendaMetrics";
import useAuth from "../../hooks/useAuth";
import { toIsoLocal } from "../../hooks/useAgendaWeekNavigation";
import { showErrorAlert } from "../../utils/alerts";

import "../../styles/agenda/agenda.css";
import "../../styles/dashboard/agenda-table.css";

export default function AgendaPage() {
  const { user } = useAuth();
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState("todos");
  const [professionalScope, setProfessionalScope] = useState("all");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [paymentAppointmentId, setPaymentAppointmentId] = useState(null);
  const [newAppointmentInitialValues, setNewAppointmentInitialValues] = useState({});
  const rescheduleModal = useDisclosure();
  const paymentModal = useDisclosure();
  const newAppointmentModal = useDisclosure();
  const newClientModal = useDisclosure();
  const redirectToLogin = useUnauthorizedRedirect();

  useEffect(() => {
    if (user?.permissions?.viewAllAgenda) {
      setProfessionalScope("all");
      return;
    }

    setProfessionalScope(user?.professional?.id || "");
  }, [user?.permissions?.viewAllAgenda, user?.professional?.id]);

  const selectedProfessionalId =
    user?.permissions?.viewAllAgenda
      ? professionalScope === "all"
        ? ""
        : professionalScope === "mine"
          ? user?.professional?.id || ""
          : professionalScope
      : user?.professional?.id || "";

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
    rooms,
    services,
    createAppointment,
    refreshAgendaData,
    updateAppointment,
  } = useAgendaData(currentDate, selectedProfessionalId);

  useEffect(() => {
    if (errorStatus === 401) {
      redirectToLogin();
    }
  }, [errorStatus, redirectToLogin]);

  const {
    hasFilters,
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

  const paymentAppointment = useMemo(
    () => normalizedAppointments.find((appointment) => appointment.id === paymentAppointmentId) || null,
    [normalizedAppointments, paymentAppointmentId]
  );

  const professionalFilterOptions = useMemo(() => {
    if (!user?.permissions?.viewAllAgenda) {
      return [];
    }

    const options = [{ value: "all", label: "Todos os profissionais" }];

    if (user?.professional?.id) {
      options.push({ value: "mine", label: "Minha agenda" });
    }

    professionals.forEach((professional) => {
      options.push({
        value: professional.id,
        label: professional.name,
      });
    });

    return options.filter(
      (option, index, collection) => collection.findIndex((item) => item.value === option.value) === index
    );
  }, [professionals, user?.permissions?.viewAllAgenda, user?.professional?.id]);

  function openModal(appointment) {
    setSelectedAppointmentId(appointment.id);
    rescheduleModal.close();
  }

  function closeModal() {
    setSelectedAppointmentId(null);
    rescheduleModal.close();
  }

  function openPaymentModal(appointment) {
    setPaymentAppointmentId(appointment.id);
    closeModal();
    paymentModal.open();
  }

  function closePaymentModal() {
    setPaymentAppointmentId(null);
    paymentModal.close();
  }

  function openRescheduleModal() {
    rescheduleModal.open();
  }

  function returnToAppointmentModal() {
    rescheduleModal.close();
  }

  function openSelectedAppointmentPayment() {
    if (!selectedAppointment) {
      return;
    }

    openPaymentModal(selectedAppointment);
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
      await showErrorAlert(requestError.message || "Não foi possível criar o agendamento.");
      return false;
    }

    return true;
  }

  async function handleUpdateAppointment(id, changes) {
    try {
      await updateAppointment(id, changes);
    } catch (requestError) {
      await showErrorAlert(requestError.message || "Não foi possível atualizar o agendamento.");
      return false;
    }

    return true;
  }

  async function handleNewClient(client) {
    try {
      await createClient(client);
      refreshAgendaData();
    } catch (requestError) {
      await showErrorAlert(requestError.message || "Não foi possível criar o cliente.");
      return false;
    }

    return true;
  }

  async function handleAppointmentPayment(payload) {
    if (!paymentAppointment) {
      return false;
    }

    try {
      const completion = await completeAppointment(paymentAppointment.id, {
        receivedBy: payload.receivedBy,
      });
      const billingId = completion?.billing?.id || paymentAppointment.billingId;

      if (payload.paymentMode !== "depois") {
        if (!billingId) {
          throw new Error("Cobrança não encontrada para este atendimento.");
        }

        await payBilling(billingId, {
          amount: payload.amount,
          paymentMethod: payload.paymentMethod,
          notes: payload.notes,
        });
      }

      await refreshAgendaData();
      return true;
    } catch (requestError) {
      await showErrorAlert(requestError.message || "Não foi possível registrar o recebimento.");
      return false;
    }
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
              extraValue={professionalScope}
              onExtraChange={setProfessionalScope}
              extraOptions={professionalFilterOptions}
              extraPlaceholder="Filtrar profissional"
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
                onMoveAppointment={handleUpdateAppointment}
                onSelect={openModal}
                visibleAppointmentIds={visibleAppointmentIds}
              />

             {/* <AgendaSidebar
                livresAgora={livresAgora}
                resumoAgenda={resumoAgenda}
              />
              */}
              {!rescheduleModal.isOpen ? (
                <AppointmentModal
                  appointment={selectedAppointment}
                  onClose={closeModal}
                  onRequestReceive={openSelectedAppointmentPayment}
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
          defaultDate={toIsoLocal(new Date())}
          hours={hours}
          initialValues={newAppointmentInitialValues}
          onClose={closeNewAppointment}
          onSave={handleNewAppointment}
          professionals={professionals}
          rooms={rooms}
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

      {paymentModal.isOpen && paymentAppointment ? (
        <AppointmentPaymentModal
          appointment={paymentAppointment}
          onClose={closePaymentModal}
          onSave={handleAppointmentPayment}
        />
      ) : null}
    </section>
  );
}
