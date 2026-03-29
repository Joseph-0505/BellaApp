import "../../styles/clientes/cliente-status-badge.css";
import { statusLabel } from "../../utils/StatusUtils";

export default function ClienteStatusBadge({ status }) {
  return (
    <span className={`cliente-status-badge cliente-status-badge-${status}`}>
      <span className="cliente-status-dot" aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}
