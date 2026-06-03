import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AgendaTable from "../../components/dashboard/AgendaTable";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import KpiCard from "../../components/dashboard/KpiCard";
import OnboardingChecklist from "../../components/dashboard/OnboardingChecklist";
import TopServicesList from "../../components/dashboard/TopServicesList";
import useAuth from "../../hooks/useAuth";
import useDisclosure from "../../hooks/useDisclosure";
import useUnauthorizedRedirect from "../../hooks/useUnauthorizedRedirect";
import { toIsoLocal } from "../../hooks/useAgendaWeekNavigation";
import NovoAgendamento from "../../components/modals/NovoAgendamento";
import AppointmentPaymentModal from "../../components/modals/AppointmentPaymentModal";
import NovoCliente from "../../components/modals/NovoCliente";
import ReagendamentoModal from "../../components/modals/ReagendamentoModal";
import {
  completeAppointment,
  createAppointment,
  getAgendaData,
  getDashboardData,
  updateAppointment,
} from "../../services/appointmentService";
import { payBilling } from "../../services/cashService";
import { createClient } from "../../services/clientService";
import { getOnboardingChecklistStatus } from "../../services/onboardingService";
import { showErrorAlert, showInfoAlert } from "../../utils/alerts";
import { DEFAULT_TIME_SLOTS } from "../../utils/timeUtils";
import "../../styles/dashboard/dashboard.css";

const REFRESH_MS = 30000;

function formatDashboardDate(date) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${date}T12:00:00`));
}

function shiftIsoDate(date, days) {
  const nextDate = new Date(`${date}T12:00:00`);
  nextDate.setDate(nextDate.getDate() + days);
  return toIsoLocal(nextDate);
}

function AlertList({ alertas }) {
  return (
    <article className="panel">
      <h2>Alertas rÃ¡pidos</h2>
      <ul className="alert-list">
        {alertas.length === 0 ? <li>Nenhum alerta no momento.</li> : null}
        {alertas.map((alerta) => (
          <li key={alerta.id}>{alerta.mensagem}</li>
        ))}
      </ul>
    </article>
  );
}

function DashboardError({ message, onRetry }) {
  return (
    <section className="dashboard-page">
      <p>{message}</p>
      <button onClick={onRetry} className="btn-soft" type="button">
        Tentar novamente
      </button>
    </section>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resumo, setResumo] = useState({});
  const [agendaHoje, setAgendaHoje] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [topServicos, setTopServicos] = useState([]);
  const [checklist, setChecklist] = useState(null);
  const [checklistLoading, setChecklistLoading] = useState(true);
  const [references, setReferences] = useState({ clients: [], professionals: [], rooms: [], services: [] });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [paymentAppointment, setPaymentAppointment] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => toIsoLocal(new Date()));
  const [rescheduleAppointments, setRescheduleAppointments] = useState([]);
  const [rescheduleHours, setRescheduleHours] = useState([]);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const newAppointmentModal = useDisclosure();
  const newClientModal = useDisclosure();
  const paymentModal = useDisclosure();

  const { user: currentUser } = useAuth();
  const appointmentModalRequestRef = useRef(0);
  const redirectToLogin = useUnauthorizedRedirect();

  const kpis = useMemo(() => {
    return [
      {
        label: "Agendamentos do dia",
        value: resumo.agendamentosHoje || 0,
        trend: "Volume do dia",
      },
      {
        label: "Confirmados",
        value: resumo.confirmados || 0,
        trend: "Atendimentos confirmados",
      },
      {
        label: "Pendentes",
        value: resumo.pendentes || 0,
        trend: "Precisam de confirmaÃ§Ã£o",
      },
      {
        label: "Cancelados",
        value: resumo.cancelados || 0,
        trend: "Cancelamentos do dia",
      },
    ];
  }, [resumo]);

  const isTodaySelected = selectedDate === toIsoLocal(new Date());
  const selectedDateLabel = useMemo(() => formatDashboardDate(selectedDate), [selectedDate]);
  const agendaTitle = isTodaySelected ? "Agenda de hoje" : `Agenda de ${selectedDateLabel}`;
  const emptyAgendaMessage = isTodaySelected
    ? "Sem agendamentos para hoje."
    : `Sem agendamentos para ${selectedDateLabel}.`;
  const checklistItems = checklist?.items || [];
  const showChecklist = checklistLoading || checklistItems.some((item) => !item.completed);
  const hasServices = (checklist?.counts?.services ?? references.services.length) > 0;
  const hasClients = (checklist?.counts?.clients ?? references.clients.length) > 0;
  const hasProfessionals = references.professionals.length > 0;

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getDashboardData(selectedDate);
      setResumo(data.resumo);
      setAgendaHoje(data.agendaHoje);
      setAlertas(data.alertas);
      setTopServicos(data.topServicos);
      setReferences(data.references || { clients: [], professionals: [], rooms: [], services: [] });
    } catch (err) {
      if (err.status === 401) {
        redirectToLogin();
        return;
      }

      setError(err.message || "Falha ao carregar dashboard.");
    } finally {
      setLoading(false);
    }
  }, [redirectToLogin, selectedDate]);

  const loadChecklist = useCallback(async () => {
    try {
      setChecklistLoading(true);
      const data = await getOnboardingChecklistStatus();
      setChecklist(data);
      return data;
    } catch (err) {
      if (err.status === 401) {
        redirectToLogin();
        return null;
      }

      return null;
    } finally {
      setChecklistLoading(false);
    }
  }, [redirectToLogin]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  useEffect(() => {
    const id = setInterval(loadDashboard, REFRESH_MS);
    return () => clearInterval(id);
  }, [loadDashboard]);

  useEffect(() => {
    closeReagendamentoModal();
    closePaymentModal();
  }, [selectedDate]);

  function handleSelectedDateChange(nextDate) {
    if (!nextDate) {
      return;
    }

    setSelectedDate(nextDate);
  }

  function goToToday() {
    setSelectedDate(toIsoLocal(new Date()));
  }

  function goToPrevDay() {
    setSelectedDate((current) => shiftIsoDate(current, -1));
  }

  function goToNextDay() {
    setSelectedDate((current) => shiftIsoDate(current, 1));
  }

  async function openNewAppointmentFlow() {
    if (loading) {
      return;
    }

    if (!hasServices) {
      await showInfoAlert("Cadastre o primeiro serviÃ§o antes de criar um agendamento.", {
        confirmButtonText: "Ir para serviÃ§os",
        title: "Falta um serviÃ§o",
      });
      navigate("/servicos");
      return;
    }

    if (!hasClients) {
      await showInfoAlert("Cadastre o primeiro cliente para continuar com o agendamento.", {
        confirmButtonText: "Cadastrar cliente",
        title: "Falta um cliente",
      });
      newClientModal.open();
      return;
    }

    if (!hasProfessionals) {
      await showInfoAlert("Cadastre um profissional para liberar novos agendamentos.", {
        confirmButtonText: "Ir para profissionais",
        title: "Falta um profissional",
      });
      navigate("/profissionais");
      return;
    }

    newAppointmentModal.open();
  }

  function handleChecklistAction(itemId) {
    if (itemId === "service") {
      navigate("/servicos");
      return;
    }

    if (itemId === "client") {
      newClientModal.open();
      return;
    }

    void openNewAppointmentFlow();
  }

  function closeReagendamentoModal() {
    appointmentModalRequestRef.current += 1;
    setSelectedAppointment(null);
    setRescheduleAppointments([]);
    setRescheduleHours([]);
    setRescheduleLoading(false);
  }

  function openPaymentModal(appointment) {
    setPaymentAppointment(appointment);
    paymentModal.open();
  }

  function closePaymentModal() {
    setPaymentAppointment(null);
    paymentModal.close();
  }

  async function openReagendamentoModal(appointment) {
    const requestId = appointmentModalRequestRef.current + 1;
    appointmentModalRequestRef.current = requestId;

    setSelectedAppointment(appointment);
    setRescheduleAppointments([]);
    setRescheduleHours([]);
    setRescheduleLoading(true);

    try {
      const data = await getAgendaData(new Date(`${appointment.day}T00:00:00`));
      if (appointmentModalRequestRef.current !== requestId) {
        return;
      }

      setRescheduleAppointments(data.appointments || []);
      setRescheduleHours(data.hours || []);
    } catch (err) {
      if (appointmentModalRequestRef.current !== requestId) {
        return;
      }

      closeReagendamentoModal();
      await showErrorAlert(err.message || "NÃ£o foi possÃ­vel carregar os horÃ¡rios para reagendamento.");
      return;
    }

    if (appointmentModalRequestRef.current === requestId) {
      setRescheduleLoading(false);
    }
  }

  async function handleAgendaAction(appt, action) {
    if (action === "Receber") {
      openPaymentModal(appt);
      return;
    }

    if (action === "Remarcar") {
      await openReagendamentoModal(appt);
      return;
    }

    const mapStatus = {
      Confirmar: "confirmado",
      Cancelar: "cancelado",
    };

    const nextStatus = mapStatus[action];
    if (!nextStatus) return;

    try {
      await updateAppointment(appt, { status: nextStatus });
      await loadDashboard();
    } catch (err) {
      await showErrorAlert(err.message || "NÃ£o foi possÃ­vel atualizar o agendamento.");
    }
  }

  async function handleDashboardAppointmentUpdate(id, changes) {
    const currentAppointment =
      agendaHoje.find((appointment) => appointment.id === id) ||
      (selectedAppointment?.id === id ? selectedAppointment : null);

    if (!currentAppointment) {
      return false;
    }

    try {
      const updatedAppointment = await updateAppointment(currentAppointment, changes);

      if (updatedAppointment) {
        setSelectedAppointment((current) => (current?.id === id ? updatedAppointment : current));
      }

      await loadDashboard();
    } catch (err) {
      await showErrorAlert(err.message || "NÃ£o foi possÃ­vel atualizar o agendamento.");
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
          throw new Error("CobranÃ§a nÃ£o encontrada para este atendimento.");
        }

        await payBilling(billingId, {
          amount: payload.amount,
          paymentMethod: payload.paymentMethod,
          notes: payload.notes,
        });
      }

      await loadDashboard();
      return true;
    } catch (err) {
      await showErrorAlert(err.message || "NÃ£o foi possÃ­vel registrar o recebimento.");
      return false;
    }
  }

  async function handleDashboardAppointmentSave(appointment) {
    try {
      await createAppointment(appointment);
      await Promise.all([loadDashboard(), loadChecklist()]);
    } catch (err) {
      await showErrorAlert(err.message || "NÃ£o foi possÃ­vel criar o agendamento.");
      return false;
    }

    return true;
  }

  async function handleDashboardClientSave(client) {
    try {
      const createdClient = await createClient(client);

      setReferences((current) => ({
        ...current,
        clients: [...current.clients, { id: createdClient.id, name: createdClient.name }],
      }));

      setAlertas((current) => [
        {
          id: `client-${createdClient.id}`,
          mensagem: `Novo cliente cadastrado: ${createdClient.name}.`,
        },
        ...current,
      ]);

      await loadChecklist();
    } catch (err) {
      await showErrorAlert(err.message || "NÃ£o foi possÃ­vel cadastrar o cliente.");
      return false;
    }

    return true;
  }

  if (error) return <DashboardError message={error} onRetry={loadDashboard} />;

  return (
    <section className="dashboard-page">
      <DashboardHeader
        faturamentoPrevisto={resumo.faturamentoPrevisto || 0}
        nomeClinica={currentUser?.businessProfile?.businessName || currentUser?.name || "Painel da ClÃ­nica"}
        onDateChange={handleSelectedDateChange}
        onGoToday={goToToday}
        onNewAppointment={() => {
          void openNewAppointmentFlow();
        }}
        onNewClient={newClientModal.open}
        onNextDay={goToNextDay}
        onPrevDay={goToPrevDay}
        selectedDate={selectedDate}
        totalAtendimentos={resumo.agendamentosHoje || 0}
      />

      {showChecklist ? (
        <OnboardingChecklist
          completedCount={checklist?.completedCount || 0}
          items={checklistItems}
          loading={checklistLoading}
          onAction={handleChecklistAction}
        />
      ) : null}

      <section className="kpi-grid">
        {kpis.map((item) => (
          <KpiCard key={item.label} label={item.label} trend={item.trend} value={item.value} />
        ))}
      </section>

      {/* <RevenueCard
        atualizadoEm={resumo.atualizadoEm}
        previsto={resumo.faturamentoPrevisto || 0}
        recebido={resumo.faturamentoRecebido || 0}
      /> */}

      <section className="dash-main-grid">
        <AgendaTable appointments={agendaHoje} emptyMessage={emptyAgendaMessage} onAction={handleAgendaAction} title={agendaTitle} />
        <aside className="side-stack">
          <AlertList alertas={alertas} />
          <TopServicesList topServicos={topServicos} />
        </aside>
      </section>

      {selectedAppointment ? (
        <ReagendamentoModal
          appointment={selectedAppointment}
          appointments={rescheduleAppointments}
          hours={rescheduleHours}
          loadWeekData={getAgendaData}
          onClose={closeReagendamentoModal}
          onUpdate={handleDashboardAppointmentUpdate}
          scheduleLoading={rescheduleLoading}
        />
      ) : null}

      {newAppointmentModal.isOpen ? (
        <NovoAgendamento
          clients={references.clients}
          defaultDate={selectedDate}
          description="Crie um atendimento rÃ¡pido direto do dashboard."
          hours={DEFAULT_TIME_SLOTS}
          onClose={newAppointmentModal.close}
          onSave={handleDashboardAppointmentSave}
          professionals={references.professionals}
          rooms={references.rooms}
          services={references.services}
          title="Agendar no Dashboard"
        />
      ) : null}

      {newClientModal.isOpen ? (
        <NovoCliente
          description="Cadastre um cliente sem sair do dashboard."
          onClose={newClientModal.close}
          onSave={handleDashboardClientSave}
          title="Cadastrar Cliente"
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
