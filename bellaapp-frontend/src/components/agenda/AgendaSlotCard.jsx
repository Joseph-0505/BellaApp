import { statusColor } from "../../utils/agendaUtils";
import formatCurrency from "../../utils/formatters";

export default function AgendaSlotCard({ appointment, isDimmed = false, onClick }) {
  return (
    <button
      type="button"
      className={`agenda-slot-card${isDimmed ? " is-dimmed" : ""}`}
      aria-label={`Abrir agendamento de ${appointment.cliente}`}
      onClick={onClick}
      style={{
        background: statusColor(appointment.status),
        borderLeft: "4px solid #d6deeb",
      }}
    >
      <strong>{appointment.cliente}</strong>

      <p className="agenda-slot-text">{appointment.servico}</p>

      {appointment.profissional ? <p className="agenda-slot-text">{appointment.profissional}</p> : null}

      <p className="agenda-slot-meta">
        Estimado: {formatCurrency(appointment.valorEstimado)}
      </p>
    </button>
  );
}
