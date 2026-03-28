import { statusColor, statusLabel } from "../../utils/agendaUtils";
import formatCurrency from "../../utils/formatters";

export default function AgendaSlotCard({ appointment, isDimmed = false, onClick }) {
  const status = appointment.status || "cancelado";

  return (
    <button
      type="button"
      className={`agenda-slot-card${isDimmed ? " is-dimmed" : ""}`}
      aria-label={`Abrir agendamento de ${appointment.cliente}`}
      onClick={onClick}
      data-status={status}
      style={{
        "--slot-surface": statusColor(status),
      }}
    >
     
      <div className="agenda-slot-head">
        <strong className="agenda-slot-title">{appointment.cliente}</strong>
        <span className="agenda-slot-status">{statusLabel(status)}</span>
      </div>

      <p className="agenda-slot-service">{appointment.servico}</p>

      {appointment.profissional ? (
        <p className="agenda-slot-text agenda-slot-secondary">{appointment.profissional}</p>
      ) : null}

      <div className="agenda-slot-footer">
        <span className="agenda-slot-value">{formatCurrency(appointment.valorEstimado)}</span>
      </div>
    </button>
  );
}
