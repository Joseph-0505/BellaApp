import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AgendaTable from "../../components/dashboard/AgendaTable";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import KpiCard from "../../components/dashboard/KpiCard";
import RevenueCard from "../../components/dashboard/RevenueCard";
import TopServicesList from "../../components/dashboard/TopServicesList";
import NovoAgendamento from "../../components/modals/NovoAgendamento";
import NovoCliente from "../../components/modals/NovoCliente";
import ReagendamentoModal from "../../components/modals/ReagendamentoModal";
import {
  createAppointment,
  getAgendaData,
  getDashboardData,
  updateAppointment,
} from "../../services/appointmentService";
import { createClient } from "../../services/clientService";
import { clearSession, getCurrentUser } from "../../services/api";
import "../../styles/dashboard/dashboard.css";

const REFRESH_MS = 30000;

function AlertList({ alertas }) {
  return (
    <article className="panel">
      <h2>Alertas rápidos</h2>
      <ul className="alert-list">
        {alertas.length === 0 ? <li>Nenhum alerta no momento.</li> : null}
        {alertas.map((alerta) => (
          <li key={alerta.id}>{alerta.mensagem}</li>
        ))}
      </ul>
    </article>
  );
}

function DashboardLoading() {
  return (
    <section className="dashboard-page">
      <p>Carregando dashboard...</p>
    </section>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resumo, setResumo] = useState({});
  const [agendaHoje, setAgendaHoje] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [topServicos, setTopServicos] = useState([]);
  const [references, setReferences] = useState({ clients: [], professionals: [], services: [] });
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleAppointments, setRescheduleAppointments] = useState([]);
  const [rescheduleHours, setRescheduleHours] = useState([]);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  const currentUser = getCurrentUser();
  const appointmentModalRequestRef = useRef(0);

  const kpis = useMemo(() => {
    return [
      {
        label: "Agendamentos hoje",
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
        trend: "Precisam de confirmação",
      },
      {
        label: "Cancelados",
        value: resumo.cancelados || 0,
        trend: "Cancelamentos do dia",
      },
    ];
  }, [resumo]);

  const loadDashboard = useCallback(async () => {
    try {
      setError("");
      const data = await getDashboardData();
      setResumo(data.resumo);
      setAgendaHoje(data.agendaHoje);
      setAlertas(data.alertas);
      setTopServicos(data.topServicos);
      setReferences(data.references || { clients: [], professionals: [], services: [] });
    } catch (err) {
      if (err.status === 401) {
        clearSession();
        window.location.href = "/login";
        return;
      }

      setError(err.message || "Falha ao carregar dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const id = setInterval(loadDashboard, REFRESH_MS);
    return () => clearInterval(id);
  }, [loadDashboard]);

  function closeReagendamentoModal() {
    appointmentModalRequestRef.current += 1;
    setSelectedAppointment(null);
    setRescheduleAppointments([]);
    setRescheduleHours([]);
    setRescheduleLoading(false);
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
      alert(err.message || "Nao foi possivel carregar os horarios para reagendamento.");
      return;
    }

    if (appointmentModalRequestRef.current === requestId) {
      setRescheduleLoading(false);
    }
  }

  async function handleAgendaAction(appt, action) {
    if (action === "Remarcar") {
      await openReagendamentoModal(appt);
      return;
    }

    const mapStatus = {
      Confirmar: "confirmado",
      Concluir: "concluido",
      Cancelar: "cancelado",
    };

    const nextStatus = mapStatus[action];
    if (!nextStatus) return;

    try {
      await updateAppointment(appt, { status: nextStatus });
      await loadDashboard();
    } catch (err) {
      alert(err.message || "Não foi possivel atualizar o agendamento.");
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
      alert(err.message || "Nao foi possivel atualizar o agendamento.");
      return false;
    }

    return true;
  }

  async function handleDashboardAppointmentSave(appointment) {
    try {
      await createAppointment(appointment);
      await loadDashboard();
    } catch (err) {
      alert(err.message || "Não foi possivel criar o agendamento.");
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
    } catch (err) {
      alert(err.message || "Não foi possivel cadastrar o cliente.");
      return false;
    }

    return true;
  }

  if (loading) return <DashboardLoading />;
  if (error) return <DashboardError message={error} onRetry={loadDashboard} />;

  return (
    <section className="dashboard-page">
      <DashboardHeader
        faturamentoPrevisto={resumo.faturamentoPrevisto || 0}
        nomeClinica={currentUser?.businessProfile?.businessName || currentUser?.name || "Painel da Clinica"}
        onNewAppointment={() => setIsNewAppointmentOpen(true)}
        onNewClient={() => setIsNewClientOpen(true)}
        totalAtendimentos={resumo.agendamentosHoje || 0}
      />

      <section className="kpi-grid">
        {kpis.map((item) => (
          <KpiCard key={item.label} label={item.label} trend={item.trend} value={item.value} />
        ))}
      </section>

      <RevenueCard
        atualizadoEm={resumo.atualizadoEm}
        previsto={resumo.faturamentoPrevisto || 0}
        recebido={resumo.faturamentoRecebido || 0}
      />

      <section className="dash-main-grid">
        <AgendaTable appointments={agendaHoje} onAction={handleAgendaAction} />
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

      {isNewAppointmentOpen ? (
        <NovoAgendamento
          clients={references.clients}
          defaultDate={new Date().toISOString().split("T")[0]}
          description="Crie um atendimento rápido direto do dashboard."
          hours={["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"]}
          onClose={() => setIsNewAppointmentOpen(false)}
          onSave={handleDashboardAppointmentSave}
          professionals={references.professionals}
          services={references.services}
          title="Agendar no Dashboard"
        />
      ) : null}

      {isNewClientOpen ? (
        <NovoCliente
          description="Cadastre um cliente sem sair do dashboard."
          onClose={() => setIsNewClientOpen(false)}
          onSave={handleDashboardClientSave}
          title="Cadastrar Cliente"
        />
      ) : null}
    </section>
  );
}
