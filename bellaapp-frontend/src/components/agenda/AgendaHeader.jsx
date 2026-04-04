import { formatWeekRangeLabel } from "../../hooks/useAgendaWeekNavigation";
import Header from "../layout/Header";
import "../../styles/agenda/agenda-header.css";

export default function AgendaHeader({
  currentDate,
  onPrevWeek,
  onNextWeek,
  onToday,
  onNewClient,
  onNewAppointment,
}) {
  const leftContent = (
    <div className="agenda-nav">
      <button type="button" onClick={onPrevWeek} aria-label="Semana anterior">
        {"<"}
      </button>
      <h2>{formatWeekRangeLabel(currentDate)}</h2>
      <button type="button" onClick={onNextWeek} aria-label="Próxima semana">
        {">"}
      </button>
    </div>
  );

  const actions = (
    <>
      <button type="button" className="btn-today" onClick={onToday}>
        Hoje
      </button>
      <button type="button" className="btn-primary" onClick={onNewAppointment}>
        Novo Agendamento
      </button>
      <button type="button" className="btn-soft" onClick={onNewClient}>
        Novo Cliente
      </button>
    </>
  );

  return (
    <Header
      title="Agenda"
      subtitle="Organize seus atendimentos e tenha total controle da sua agenda"
      leftContent={leftContent}
      actions={actions}
      className="agenda-header"
    />
  );
}
