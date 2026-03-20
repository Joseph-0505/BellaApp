import { useEffect, useMemo, useState } from "react";
import { getAgendaData } from "../../services/agendaService";
import {riskColor, riskLabel, statusColor} from "../../utils/agendaUtils";
import AgendaHeader from "../../components/agenda/AgendaHeader";
import AgendaWeekTable from "../../components/agenda/AgendaWeekTable";
import AgendaFilters from "../../components/agenda/AgendaFilters";
import AgendaSidebar from "../../components/agenda/AgendaSidebar";
import "../../styles/agenda/agenda.css";
import "../../styles/dashboard/agenda-table.css";

/* ================= COMPONENT ================= */

export default function AgendaPage() {
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState("todos");

  const [agendaData, setAgendaData] = useState({
    days: [],
    hours: [],
    appointments: [],
  });

  const [loading, setLoading] = useState(true);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    async function load() {
      try {
        const data = await getAgendaData();

        setAgendaData({
          days: data?.days || [],
          hours: data?.hours || [],
          appointments: data?.appointments || [],
        });
      } catch {
        setAgendaData({
          days: [],
          hours: [],
          appointments: [],
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  /* ================= FILTER ================= */

  const filtered = useMemo(() => {
    return agendaData.appointments.filter((a) => {
      const matchTerm =
        !term ||
        a.cliente.toLowerCase().includes(term.toLowerCase()) ||
        a.servico.toLowerCase().includes(term.toLowerCase());

      const matchStatus =
        status === "todos" || a.status === status;

      return matchTerm && matchStatus;
    });
  }, [agendaData.appointments, term, status]);

  /* ================= SUMMARY ================= */

  const resumoAgenda = useMemo(() => {
    const receitaProjetada = filtered.reduce(
      (acc, a) => acc + Number(a.valorEstimado || 0),
      0
    );

    const riscoAlto = filtered.filter(
      (a) => a.riscoNoShow === "alto"
    ).length;

    const pendentes = filtered.filter(
      (a) => a.status === "pendente"
    ).length;

    return {
      receitaProjetada,
      riscoAlto,
      pendentes,
    };
  }, [filtered]);

  /* ================= FREE SLOTS ================= */

  const livresAgora = useMemo(() => {
    const busyKeys = new Set(
      filtered.map((a) => a.day + "-" + a.hour)
    );

    return agendaData.days
      .flatMap((d) =>
        agendaData.hours.map((h) => ({
          day: d.key,
          label: d.label,
          hour: h,
        }))
      )
      .filter(
        (slot) =>
          !busyKeys.has(slot.day + "-" + slot.hour)
      )
      .slice(0, 3);
  }, [agendaData.days, agendaData.hours, filtered]);

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <section className="dashboard-page">
        <p>Carregando agenda...</p>
      </section>
    );
  }

  /* ================= UI ================= */

  return (
    <section className="dashboard-page">
      {/* HEADER */}
      <AgendaHeader />

      {/* PANEL */}
      <article className="panel">
        {/* FILTERS */}
        <AgendaFilters
          term={term}
          setTerm={setTerm}
          status={status}
          setStatus={setStatus}
        />

        {/* GRID */}
        <div className="agenda-layout-grid">
          {/* TABELA */}
          <AgendaWeekTable
            days={agendaData.days}
            hours={agendaData.hours}
            appointments={filtered}
            riskLabel={riskLabel}
            riskColor={riskColor}
            statusColor={statusColor}
          />

          {/* SIDEBAR */}
         <AgendaSidebar
            livresAgora={livresAgora}
            resumoAgenda={resumoAgenda}
          />
        </div>
      </article>
    </section>
  );
}