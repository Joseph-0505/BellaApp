import NovoAgendamentoBtn from "../../components/buttons/NovoAgendamentoBtn";
import NovoClienteBtn from "../../components/buttons/NovoClienteBtn";
import EncaixeRapidoBtn from "../../components/buttons/EncaixeRapidoBtn";
import "../../styles/agenda/agenda-header.css";

export default function AgendaHeader({
  currentDate,
  onPrevWeek,
  onNextWeek,
  onToday,
}) {
  function formatWeek(date) {
    const start = new Date(date);

    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const options = { day: "2-digit", month: "long" };

    return `Semana de ${start.toLocaleDateString(
      "pt-BR",
      options
    )} a ${end.toLocaleDateString("pt-BR", options)}`;
  }

  return (
  <div className="agenda-header">
    <h1 className="agenda-h1">Agenda</h1>
    <div className="agenda-header-row">
      <div className="agenda-nav">
        <button onClick={onPrevWeek}>←</button>
        <h2>{formatWeek(currentDate)}</h2>
        <button onClick={onNextWeek}>→</button>
      </div>

      <div className="agenda-actions">
        <button className="btn-today" onClick={onToday}>
          Hoje
        </button>

        <NovoAgendamentoBtn />
        <NovoClienteBtn />
        <EncaixeRapidoBtn />
      </div>
    </div>
  </div>
);
}