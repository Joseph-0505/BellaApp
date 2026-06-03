import statusClass from "./StatusClass";
import statusLabel from "./StatusLabel";
import "../../styles/dashboard/status-badge.css";

export default function StatusBadge({ status }) {
  return <span className={`status-badge ${statusClass(status)}`}>{statusLabel(status)}</span>;
}
