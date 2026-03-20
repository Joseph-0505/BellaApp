import statusLabel from "./StatusLabel";
import statusClass from "./StatusClass";

export default function StatusBadge({ status }) {
  return (
    <span className={"status-badge " + statusClass(status)}>
      {statusLabel(status)}
    </span>
  );
}