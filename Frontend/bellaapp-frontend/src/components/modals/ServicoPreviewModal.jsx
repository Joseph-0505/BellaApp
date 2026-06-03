import { BadgeDollarSign, CalendarClock, ClipboardList, FileText } from "lucide-react";
import FormModalShell from "./FormModalShell";
import formatCurrency, { formatDuration } from "../../utils/formatters";
import { statusLabel } from "../../utils/StatusUtils";

export default function ServicoPreviewModal({
  busy = false,
  onClose,
  onEdit,
  onToggleStatus,
  service,
}) {
  if (!service) {
    return null;
  }

  return (
    <FormModalShell
      title="Serviço"
      description="Consulte os detalhes principais e ajuste o status sem sair da listagem."
      onClose={onClose}
      size="compact"
    >
      <div className="service-preview">
        <section className="service-preview-hero">
          <div>
            <span className="service-preview-eyebrow">Catálogo</span>
            <h3>{service.name}</h3>
          </div>

          <span className={`service-badge service-badge-status-${service.status}`}>{statusLabel(service.status)}</span>
        </section>

        <section className="service-preview-grid">
          <article className="service-preview-card">
            <span className="service-preview-card-label">
              <BadgeDollarSign size={16} aria-hidden="true" />
              Preço
            </span>
            <strong>{formatCurrency(service.price)}</strong>
            <p>Valor atual praticado no catálogo.</p>
          </article>

          <article className="service-preview-card">
            <span className="service-preview-card-label">
              <CalendarClock size={16} aria-hidden="true" />
              Duração
            </span>
            <strong>{formatDuration(service.durationMinutes)}</strong>
            <p>Tempo médio reservado por atendimento.</p>
          </article>

          <article className="service-preview-card">
            <span className="service-preview-card-label">
              <ClipboardList size={16} aria-hidden="true" />
              Agendamentos
            </span>
            <strong>{service.soldCount}</strong>
            <p>Total acumulado de atendimentos vinculados a este servico.</p>
          </article>

          <article className="service-preview-card">
            <span className="service-preview-card-label">
              <FileText size={16} aria-hidden="true" />
              Descrição
            </span>
            <strong>{service.description ? "Detalhes cadastrados" : "Sem descrição"}</strong>
            <p>{service.description || "Adicione contexto para orientar a equipe e padronizar a venda."}</p>
          </article>
        </section>

        <footer className="service-preview-footer">
          <button type="button" className="form-modal-button form-modal-button-secondary" onClick={onClose}>
            Fechar
          </button>

          <div className="service-preview-actions">
            <button
              type="button"
              className="form-modal-button form-modal-button-secondary"
              onClick={() => onToggleStatus?.(service)}
              disabled={busy}
            >
              {service.active ? "Inativar serviço" : "Ativar serviço"}
            </button>

            <button
              type="button"
              className="form-modal-button form-modal-button-primary"
              onClick={() => onEdit?.(service)}
              disabled={busy}
            >
              Editar serviço
            </button>
          </div>
        </footer>
      </div>
    </FormModalShell>
  );
}
