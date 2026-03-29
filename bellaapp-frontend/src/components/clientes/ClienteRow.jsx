import "../../styles/clientes/cliente-shared.css";
import "../../styles/clientes/cliente-row.css";
import { CalendarPlus, Phone } from "lucide-react";
import DropdownActions from "../buttons/DropdownActions";
import formatCurrency from "../../utils/formatters";
import ClienteStatusBadge from "./ClienteStatusBadge";

const DEFAULT_ACTIONS = ["Visualizar", "Editar", "Excluir"];

function stopEvent(event) {
  event.stopPropagation();
}

export default function ClienteRow({
  actions = DEFAULT_ACTIONS,
  appointmentLoading = false,
  client,
  onAction,
  onOpen,
  onSchedule,
}) {
  function handleRowKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen?.(client);
    }
  }

  return (
    <article
      className="cliente-row"
      role="button"
      tabIndex={0}
      aria-label={`Abrir cliente ${client.name}`}
      onClick={() => onOpen?.(client)}
      onKeyDown={handleRowKeyDown}
    >
      <div className="cliente-col cliente-col-main" data-label="Cliente">
        <div className={`cliente-avatar cliente-avatar-${client.avatarTone}`}>{client.initials}</div>

        <div className="cliente-main-copy">
          <strong>{client.name}</strong>
          <span>{client.emailDisplay}</span>
        </div>
      </div>

      <div className="cliente-col cliente-col-phone" data-label="Telefone">
        <Phone size={18} aria-hidden="true" />
        <span>{client.phoneDisplay}</span>
      </div>

      <div className="cliente-col cliente-col-stack" data-label="Último atendimento">
        <strong className={!client.hasLatestVisit ? "cliente-empty-value" : ""}>{client.latestVisit}</strong>

        {client.hasLatestVisit ? (
          <span>{client.latestVisitNote}</span>
        ) : (
          <button
            type="button"
            className="cliente-inline-action"
            onClick={(event) => {
              stopEvent(event);
              onSchedule?.(client);
            }}
            disabled={appointmentLoading}
          >
            <CalendarPlus size={16} aria-hidden="true" />
            {appointmentLoading ? "Preparando..." : client.latestVisitEmptyLabel}
          </button>
        )}
      </div>

      <div className="cliente-col cliente-col-stack" data-label="Próximo agendamento">
        <span
          className={`cliente-mini-pill ${
            client.hasNextAppointment ? "cliente-mini-pill-scheduled" : "cliente-mini-pill-empty"
          }`}
        >
          {client.nextAppointment}
        </span>

        {client.hasNextAppointment ? (
          <span>{client.professionalDisplay}</span>
        ) : (
          <button
            type="button"
            className="cliente-inline-action"
            onClick={(event) => {
              stopEvent(event);
              onSchedule?.(client);
            }}
            disabled={appointmentLoading}
          >
            <CalendarPlus size={16} aria-hidden="true" />
            {appointmentLoading ? "Preparando..." : client.nextAppointmentEmptyLabel}
          </button>
        )}
      </div>

      <div className="cliente-col cliente-col-price" data-label="Total gasto">
        <strong>{formatCurrency(client.totalSpent)}</strong>
        <span>{client.totalSpentLabel}</span>
      </div>

      <div className="cliente-col cliente-col-status" data-label="Status">
        <ClienteStatusBadge status={client.status} />
      </div>

      <div className="cliente-col cliente-col-actions" data-label="Ações">
        <DropdownActions actions={actions} onAction={(action) => onAction?.(client, action)} />
      </div>
    </article>
  );
}
