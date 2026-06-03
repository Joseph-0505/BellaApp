import "../../styles/clientes/cliente-shared.css";
import "../../styles/clientes/cliente-preview-modal.css";
import { BadgeDollarSign, CalendarClock, FileText, Mail, Phone } from "lucide-react";
import ClienteStatusBadge from "../clientes/ClienteStatusBadge";
import FormModalShell from "./FormModalShell";
import formatCurrency from "../../utils/formatters";

export default function ClientePreviewModal({
  client,
  onClose,
  onEdit,
  onSchedule,
  scheduling = false,
}) {
  if (!client) {
    return null;
  }

  const scheduleLabel = scheduling ? "Preparando..." : client.hasNextAppointment ? "Novo agendamento" : "Agendar agora";

  return (
    <FormModalShell
      title="Cliente"
      description="Consulte o histórico principal e acesse ações rápidas sem sair da listagem."
      onClose={onClose}
      size="compact"
    >
      <div className="cliente-preview">
        <section className="cliente-preview-hero">
          <div className={`cliente-avatar cliente-avatar-${client.avatarTone} cliente-preview-avatar`}>
            {client.initials}
          </div>

          <div className="cliente-preview-copy">
            <div className="cliente-preview-heading">
              <h3>{client.name}</h3>
              <ClienteStatusBadge status={client.status} />
            </div>

            <div className="cliente-preview-contact-list">
              <span>
                <Mail size={16} aria-hidden="true" />
                {client.emailDisplay}
              </span>

              <span>
                <Phone size={16} aria-hidden="true" />
                {client.phoneDisplay}
              </span>
            </div>
          </div>
        </section>

        <section className="cliente-preview-grid">
          <article className="cliente-preview-card">
            <span className="cliente-preview-card-label">
              <CalendarClock size={16} aria-hidden="true" />
              Último atendimento
            </span>
            <strong>{client.latestVisit}</strong>
            <p>{client.hasLatestVisit ? client.latestVisitNote : "Ainda não há histórico para este cliente."}</p>
            {!client.hasLatestVisit ? (
              <button
                type="button"
                className="cliente-inline-action"
                onClick={() => onSchedule?.(client)}
                disabled={scheduling}
              >
                {scheduling ? "Preparando..." : client.latestVisitEmptyLabel}
              </button>
            ) : null}
          </article>

          <article className="cliente-preview-card">
            <span className="cliente-preview-card-label">
              <CalendarClock size={16} aria-hidden="true" />
              Próximo agendamento
            </span>
            <strong>{client.nextAppointment}</strong>
            <p>{client.hasNextAppointment ? client.professionalDisplay : "Nenhum horário futuro reservado."}</p>
            {!client.hasNextAppointment ? (
              <button
                type="button"
                className="cliente-inline-action"
                onClick={() => onSchedule?.(client)}
                disabled={scheduling}
              >
                {scheduling ? "Preparando..." : client.nextAppointmentEmptyLabel}
              </button>
            ) : null}
          </article>

          <article className="cliente-preview-card">
            <span className="cliente-preview-card-label">
              <BadgeDollarSign size={16} aria-hidden="true" />
              Total gasto
            </span>
            <strong>{formatCurrency(client.totalSpent)}</strong>
            <p>{client.totalSpentLabel}</p>
          </article>

          <article className="cliente-preview-card">
            <span className="cliente-preview-card-label">
              <FileText size={16} aria-hidden="true" />
              Observações
            </span>
            <strong>{client.notes ? "Notas internas" : "Sem observações"}</strong>
            <p>{client.notes || "Adicione preferências, restrições ou contexto para a equipe."}</p>
          </article>
        </section>

        <footer className="cliente-preview-footer">
          <button type="button" className="form-modal-button form-modal-button-secondary" onClick={onClose}>
            Fechar
          </button>

          <div className="cliente-preview-actions">
            <button
              type="button"
              className="form-modal-button form-modal-button-secondary"
              onClick={() => onSchedule?.(client)}
              disabled={scheduling}
            >
              {scheduleLabel}
            </button>

            <button type="button" className="form-modal-button form-modal-button-primary" onClick={() => onEdit?.(client)}>
              Editar cliente
            </button>
          </div>
        </footer>
      </div>
    </FormModalShell>
  );
}
