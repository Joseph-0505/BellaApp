import { statusLabel } from "../../utils/StatusUtils";

export default function RoomStatusBadge({ status }) {
  return (
    <span className={`room-status-badge room-status-badge-${status}`}>
      <span className="room-status-dot" aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}
