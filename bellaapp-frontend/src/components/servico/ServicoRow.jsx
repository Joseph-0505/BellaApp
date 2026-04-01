import {
  Clock,
  Droplets,
  FlaskConical,
  HeartPulse,
  Leaf,
  Smile,
  Sparkles,
  Syringe,
  WandSparkles,
} from "lucide-react";
import DropdownActions from "../buttons/DropdownActions";
import formatCurrency, { formatDuration } from "../../utils/formatters";

function statusLabel(status) {
  return status === "ativo" ? "Ativo" : "Inativo";
}

const SERVICE_ICON_MAP = {
  drop: Droplets,
  face: Smile,
  flask: FlaskConical,
  leaf: Leaf,
  lotus: Leaf,
  pulse: HeartPulse,
  spark: Sparkles,
  syringe: Syringe,
  wand: WandSparkles,
};

const DEFAULT_ACTIONS = ["Editar"];

export default function ServicoRow({ actions = DEFAULT_ACTIONS, onAction, service }) {
  const ServiceIcon = SERVICE_ICON_MAP[service.icon] || Smile;
  const resolvedActions = typeof actions === "function" ? actions(service) : actions;

  return (
    <article className="service-row">
      <div className="service-col service-col-main">
        <span className={`service-row-icon service-row-icon-${service.icon}`}>
          <ServiceIcon size={28} aria-hidden="true" />
        </span>

        <div className="service-main-copy">
          <strong>{service.name}</strong>
        </div>
      </div>

      <div className="service-col">
        <strong>{formatCurrency(service.price)}</strong>
      </div>

      <div className="service-col service-col-duration">
        <Clock size={18} />
        <span>{formatDuration(service.durationMinutes)}</span>
      </div>

      <div className="service-col">
        <span className={`service-badge service-badge-risk-${service.riskTone}`}>
          <span className="service-badge-dot" />
          {service.riskLabel}
        </span>
      </div>

      <div className="service-col">
        <span className={`service-badge service-badge-status-${service.status}`}>{statusLabel(service.status)}</span>
      </div>

      <div className="service-col service-col-actions">
        <DropdownActions actions={resolvedActions} onAction={(action) => onAction?.(service, action)} />
      </div>
    </article>
  );
}
