import statusLabel from "./StatusLabel";
import statusClass from "./StatusClass";
import "../../styles/dashboard/status-badge.css";

export default function StatusBadge({ status }) {
  return (
    <span className={"status-badge " + statusClass(status)}>
      {statusLabel(status)}
    </span>
  );
}