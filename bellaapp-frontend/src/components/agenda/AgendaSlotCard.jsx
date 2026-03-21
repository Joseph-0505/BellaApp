import { riskColor, riskLabel, statusColor } from "../../utils/agendaUtils";
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
        borderLeft: "4px solid " + riskColor(appointment.riscoNoShow),
      }}
    >
      <strong>{appointment.cliente}</strong>

      <p className="agenda-slot-text">{appointment.servico}</p>

      <p className="agenda-slot-text">{appointment.profissional}</p>

      <p className="agenda-slot-meta">
        Recurso: {appointment.recurso}
      </p>

      <p
        className="agenda-slot-meta"
        style={{ color: riskColor(appointment.riscoNoShow) }}
      >
        {riskLabel(appointment.riscoNoShow)}
      </p>

      <p className="agenda-slot-meta">
        Estimado: {formatCurrency(appointment.valorEstimado)}
      </p>
    </button>
  );
}
