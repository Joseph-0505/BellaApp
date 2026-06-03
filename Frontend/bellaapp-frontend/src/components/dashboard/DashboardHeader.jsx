import Header from "../layout/Header";
import formatCurrency from "../../utils/formatters";

function formatSelectedDate(selectedDate) {
  if (!selectedDate) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${selectedDate}T12:00:00`));
}

function getTodayIsoDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function DashboardHeader({
  faturamentoPrevisto,
  nomeClinica,
  onDateChange,
  onGoToday,
  onNewAppointment,
  onNewClient,
  onNextDay,
  onPrevDay,
  selectedDate,
  totalAtendimentos,
}) {
  const isToday = selectedDate === getTodayIsoDate();
  const dateLabel = formatSelectedDate(selectedDate);
  const summaryPrefix = isToday ? "Hoje" : `Em ${dateLabel}`;
  const leftContent = (
    <div className="dashboard-date-toolbar">
      <span className="dashboard-date-toolbar-label">Data do painel</span>

      <button type="button" className="btn-soft" onClick={onPrevDay}>
        Anterior
      </button>

      <label className="dashboard-date-field-inline">
        <span>Data</span>
        <input
          aria-label="Selecionar data do dashboard"
          className="dashboard-date-input"
          type="date"
          value={selectedDate}
          onChange={(event) => onDateChange?.(event.target.value)}
        />
      </label>

      <button type="button" className="btn-soft" onClick={onGoToday}>
        Hoje
      </button>

      <button type="button" className="btn-soft" onClick={onNextDay}>
        Próximo
      </button>
    </div>
  );

  return (
    <Header
      className="dashboard-header"
      leftContent={leftContent}
      title={nomeClinica || "Painel da Clínica"}
      subtitle={`${summaryPrefix} você tem ${totalAtendimentos} atendimentos e faturamento previsto de ${formatCurrency(faturamentoPrevisto)}.`}
      actions={
        <>
          <button type="button" className="btn-primary" onClick={onNewAppointment}>
            Novo Agendamento
          </button>
          <button type="button" className="btn-soft" onClick={onNewClient}>
            Novo Cliente
          </button>
        </>
      }
    />
  );
}
