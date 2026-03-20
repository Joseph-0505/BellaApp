import {riskColor, riskLabel, statusColor} from "../../utils/agendaUtils";

export default function AgendaSlotCard({ appointment, onClick}) {
  return (
    <div
      className="agenda-slot-card"
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
        Estimado: R$ {appointment.valorEstimado}
      </p>
    </div>
  );
}