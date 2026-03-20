import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardData } from "../../services/appointmentService";
import "../../styles/dashboard.css";
import StatusBadge from "../../components/dashboard/StatusBadge";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import formatCurrency  from "../../utils/formatters";

const REFRESH_MS = 30000;
const DAILY_TARGET = 3000;



function KpiCard({ label, value, trend }) {
  return (
    <article className="kpi-card">
      <h3>{label}</h3>
      <strong>{value}</strong>
      <span>{trend}</span>
    </article>
  );
}

function RevenueCard({ previsto, recebido, atualizadoEm }) {
  const falta = Math.max(DAILY_TARGET - Number(recebido || 0), 0);

  return (
    <article className="panel revenue-card">
      <div className="panel-header">
        <h2>Faturamento de hoje</h2>
        <span className="live-pill">
          <span className="live-dot" />
          Atualizando
        </span>
      </div>

      <div className="revenue-grid">
        <div>
          <p className="muted">Previsto</p>
          <strong className="revenue-value">{formatCurrency(previsto)}</strong>
        </div>

        <div>
          <p className="muted">Recebido</p>
          <strong className="revenue-value">{formatCurrency(recebido)}</strong>
        </div>

        <div>
          <p className="muted">Meta diaria</p>
          <strong className="revenue-value">{formatCurrency(DAILY_TARGET)}</strong>
        </div>

        <div>
          <p className="muted">Falta para meta</p>
          <strong className="revenue-value">{formatCurrency(falta)}</strong>
        </div>
      </div>

      <p className="updated-at">
        Ultima atualizacao:{" "}
        {atualizadoEm ? new Date(atualizadoEm).toLocaleTimeString("pt-BR") : "--:--"}
      </p>
    </article>
  );
}



function AgendaTable({ appointments }) {
  return (
    <article className="panel">
      <div className="panel-header">
        <h2>Agenda de hoje</h2>
        <Link to="/agenda" className="panel-link">
          Ver agenda completa
        </Link>
      </div>

      <div className="agenda-table-wrap">
        <table className="agenda-table">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Cliente</th>
              <th>Servico</th>
              <th>Profissional</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td colSpan="5">Sem agendamentos para hoje.</td>
              </tr>
            ) : (
              appointments.map((appt) => (
                <tr key={appt.id}>
                  <td>{appt.hora}</td>
                  <td>{appt.clienteNome}</td>
                  <td>{appt.servicoNome}</td>
                  <td>{appt.profissionalNome}</td>
                  <td>
                    <StatusBadge status={appt.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function AlertList({ alertas }) {
  return (
    <article className="panel">
      <h2>Alertas rapidos</h2>
      <ul className="alert-list">
        {alertas.length === 0 ? <li>Nenhum alerta no momento.</li> : null}
        {alertas.map((alerta) => (
          <li key={alerta.id}>{alerta.mensagem}</li>
        ))}
      </ul>
    </article>
  );
}

function TopServicesList({ topServicos }) {
  return (
    <article className="panel">
      <h2>Servicos mais agendados</h2>
      <ul className="service-list">
        {topServicos.length === 0 ? <li>Sem dados de servicos ainda.</li> : null}
        {topServicos.map((service) => (
          <li key={service.servicoNome}>
            <div className="service-head">
              <span>{service.servicoNome}</span>
              <strong>{service.quantidade}</strong>
            </div>
            <div className="meter">
              <span style={{ width: service.percentual + "%" }} />
            </div>
          </li>
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

  if (loading) return <DashboardLoading />;
  if (error) return <DashboardError message={error} onRetry={loadDashboard} />;

  return (
    <section className="dashboard-page">
      <DashboardHeader
        totalAtendimentos={resumo.agendamentosHoje || 0}
        faturamentoPrevisto={resumo.faturamentoPrevisto || 0}
      />

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
        <AgendaTable appointments={agendaHoje} />
        <aside className="side-stack">
          <AlertList alertas={alertas} />
          <TopServicesList topServicos={topServicos} />
        </aside>
      </section>
    </section>
  );
}