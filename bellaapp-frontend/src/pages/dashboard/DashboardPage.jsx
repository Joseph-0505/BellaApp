import { useCallback, useEffect, useMemo, useState } from "react";
import { getDashboardData } from "../../services/appointmentService";
import "../../styles/dashboard/dashboard.css";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import KpiCard from "../../components/dashboard/KpiCard";
import RevenueCard from "../../components/dashboard/RevenueCard";
import AgendaTable from "../../components/dashboard/AgendaTable";
import TopServicesList from "../../components/dashboard/TopServicesList";

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
      <button onClick={onRetry} className="btn-soft">
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
        trend: "Precisam de confirmacao",
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
    } catch (err) {
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


function handleAgendaAction(appt, action) {
  const mapStatus = {
    Confirmar: "confirmado",
    "Iniciar atendimento": "em_atendimento",
    Concluir: "concluido",
    Cancelar: "cancelado",
  };

  const nextStatus = mapStatus[action];
  if (!nextStatus) return;

  setAgendaHoje((prev) =>
    prev.map((item) =>
      item.id === appt.id ? { ...item, status: nextStatus } : item
    )
  );
}


  if (loading) return <DashboardLoading />;
  if (error) return <DashboardError message={error} onRetry={loadDashboard} />;

  return (
    <section className="dashboard-page">
     <DashboardHeader
      totalAtendimentos={resumo.agendamentosHoje || 0}
      faturamentoPrevisto={resumo.faturamentoPrevisto || 0}
      nomeClinica="BellaApp Estética"/> 


      <section className="kpi-grid">
        {kpis.map((item) => (
          <KpiCard
            key={item.label}
            label={item.label}
            value={item.value}
            trend={item.trend}
          />
        ))}
      </section>

      <RevenueCard
        previsto={resumo.faturamentoPrevisto || 0}
        recebido={resumo.faturamentoRecebido || 0}
        atualizadoEm={resumo.atualizadoEm}
      />

      <section className="dash-main-grid">
       <AgendaTable appointments={agendaHoje} onAction={handleAgendaAction} />
        <aside className="side-stack">
          <AlertList alertas={alertas} />
          <TopServicesList topServicos={topServicos} />
        </aside>
      </section>
    </section>
  );
}