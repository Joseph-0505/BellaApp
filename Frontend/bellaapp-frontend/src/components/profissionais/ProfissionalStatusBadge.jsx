import { statusLabel } from "../../utils/StatusUtils";

export default function ProfissionalStatusBadge({ status }) {
  return (
    <span className={`profissional-status-badge profissional-status-badge-${status}`}>
      <span className="profissional-status-dot" aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}
