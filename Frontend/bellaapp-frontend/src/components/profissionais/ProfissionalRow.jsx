import { Briefcase, Mail, Phone } from "lucide-react";
import DropdownActions from "../buttons/DropdownActions";
import ProfissionalStatusBadge from "./ProfissionalStatusBadge";

const DEFAULT_ACTIONS = ["Editar", "Excluir"];

export default function ProfissionalRow({ actions = DEFAULT_ACTIONS, onAction, professional }) {
  const resolvedActions = typeof actions === "function" ? actions(professional) : actions;

  return (
    <article className="profissional-row">
      <div className="profissional-col profissional-col-main" data-label="Profissional">
        <div className={`profissional-avatar profissional-avatar-${professional.tone}`}>
          <span>{professional.initials}</span>
        </div>

        <div className="profissional-main-copy">
          <strong>{professional.name}</strong>

          <span className="profissional-inline-meta profissional-inline-meta-subtle">
            <Mail size={16} aria-hidden="true" />
            <span>{professional.emailDisplay}</span>
          </span>

          <span className={`profissional-access-badge profissional-access-badge-${professional.accessTone}`}>
            {professional.accessLabel}
          </span>
        </div>
      </div>

      <div className="profissional-col profissional-col-specialty" data-label="Especialidade">
        <span className="profissional-inline-meta">
          <Briefcase size={18} aria-hidden="true" />
          <span>{professional.specialtyDisplay}</span>
        </span>
      </div>

      <div className="profissional-col profissional-col-phone" data-label="Telefone">
        <span className="profissional-inline-meta">
          <Phone size={18} aria-hidden="true" />
          <span>{professional.phoneDisplay}</span>
        </span>
      </div>

      <div className="profissional-col profissional-col-status" data-label="Status">
        <ProfissionalStatusBadge status={professional.status} />
      </div>

      <div className="profissional-col profissional-col-actions" data-label="Acoes">
        <DropdownActions actions={resolvedActions} onAction={(action) => onAction?.(professional, action)} />
      </div>
    </article>
  );
}
