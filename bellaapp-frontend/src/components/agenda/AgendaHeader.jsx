import { formatWeekRangeLabel } from "../../hooks/useAgendaWeekNavigation";
import LinkButton from "../buttons/LinkButton";
import Header from "../layout/Header";
import "../../styles/agenda/agenda-header.css";

export default function AgendaHeader({
  currentDate,
  onPrevWeek,
  onNextWeek,
  onToday,
  onNewAppointment,
}) {
  const leftContent = (
    <div className="agenda-nav">
      <button type="button" onClick={onPrevWeek} aria-label="Semana anterior">
        {"<"}
      </button>
      <h2>{formatWeekRangeLabel(currentDate)}</h2>
      <button type="button" onClick={onNextWeek} aria-label="Proxima semana">
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
      <LinkButton to="/clientes" className="btn-soft">
        Novo Cliente
      </LinkButton>
    </>
  );

  return (
    <Header
      title="Agenda"
      leftContent={leftContent}
      actions={actions}
      className="agenda-header"
    />
  );
}
