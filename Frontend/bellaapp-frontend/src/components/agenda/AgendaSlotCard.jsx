import { statusColor, statusLabel } from "../../utils/StatusUtils";
import formatCurrency from "../../utils/formatters";

export default function AgendaSlotCard({
  appointment,
  draggable = false,
  isDragging = false,
  isDropSettled = false,
  stacked = false,
  slotSpan = 1,
  onClick,
  onDragEnd,
  onDragStart,
}) {
  const status = appointment.status || "cancelado";
  const secondaryMeta = [appointment.profissional, appointment.sala ? `Sala: ${appointment.sala}` : ""]
    .filter(Boolean)
    .join(" • ");
  const className = `agenda-slot-card${stacked ? " is-stacked" : ""}${isDragging ? " is-dragging" : ""}${isDropSettled ? " is-drop-settled" : ""}`;

  return (
    <button
      type="button"
      className={className}
      aria-label={`Abrir agendamento de ${appointment.cliente}`}
      aria-grabbed={isDragging}
      draggable={draggable}
      onClick={onClick}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      data-status={status}
      style={{
        "--slot-surface": statusColor(status),
        "--slot-span": slotSpan,
      }}
    >
      <div className="agenda-slot-head">
        <strong className="agenda-slot-title">{appointment.cliente}</strong>
        <span className="agenda-slot-status">{statusLabel(status)}</span>
      </div>

      <p className="agenda-slot-service">{appointment.servico}</p>

      {secondaryMeta ? (
        <p className="agenda-slot-text agenda-slot-secondary">{secondaryMeta}</p>
      ) : null}

      <div className="agenda-slot-footer">
        {appointment.hour ? (
          <span className="agenda-slot-time">
            {appointment.hour}
            {appointment.endHour ? ` - ${appointment.endHour}` : ""}
          </span>
        ) : null}
        <span className="agenda-slot-value">{formatCurrency(appointment.valorEstimado)}</span>
      </div>
    </button>
  );
}
