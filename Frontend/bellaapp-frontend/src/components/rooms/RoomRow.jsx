import { BarChart3, DoorClosed } from "lucide-react";
import DropdownActions from "../buttons/DropdownActions";
import RoomStatusBadge from "./RoomStatusBadge";

const DEFAULT_ACTIONS = ["Editar", "Excluir"];

export default function RoomRow({ actions = DEFAULT_ACTIONS, onAction, room }) {
  const resolvedActions = typeof actions === "function" ? actions(room) : actions;

  return (
    <article className="room-row">
      <div className="room-col room-col-main" data-label="Sala">
        <span className="room-color-chip" style={{ "--room-color": room.color }}>
          <DoorClosed size={20} aria-hidden="true" />
        </span>

        <div className="room-main-copy">
          <strong>{room.name}</strong>
          <span>{room.colorDisplay}</span>
        </div>
      </div>

      <div className="room-col room-col-status" data-label="Status">
        <RoomStatusBadge status={room.status} />
      </div>

      <div className="room-col room-col-usage" data-label="Atendimentos/mês">
        <span className="room-inline-meta">
          <BarChart3 size={18} aria-hidden="true" />
          <span>{room.monthlyAppointmentsLabel}</span>
        </span>
      </div>

      <div className="room-col room-col-actions" data-label="Ações">
        <DropdownActions actions={resolvedActions} onAction={(action) => onAction?.(room, action)} />
      </div>
    </article>
  );
}
