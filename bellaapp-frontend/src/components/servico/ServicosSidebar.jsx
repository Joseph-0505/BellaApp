import { Archive, Calendar, Flame, Users } from "lucide-react";
import formatCurrency, { formatDuration } from "../../utils/formatters";

export default function ServicosSidebar({
  averageDuration = 0,
  averageTicket = 0,
  riskCounters,
  topService,
  totalServices = 0,
  visibleServicesCount = 0,
}) {
  return (
    <aside className="services-sidebar">
      <article className="services-sidecard">
        <h2>Serviços ({totalServices})</h2>

        <div className="services-stat-list">
          <div className="services-stat-row">
            <span className="services-dot services-dot-baixo" />
            <span>Baixo risco</span>
            <strong>{riskCounters.baixo}</strong>
          </div>

          <div className="services-stat-row">
            <span className="services-dot services-dot-medio" />
            <span> Médio risco</span>
            <strong>{riskCounters.medio}</strong>
          </div>

          <div className="services-stat-row">
            <span className="services-dot services-dot-alto" />
            <span>Alto risco</span>
            <strong>{riskCounters.alto}</strong>
          </div>
        </div>

        <div className="services-metric-row">
          <span>Ticket médio:</span>
          <strong>{formatCurrency(averageTicket)}</strong>
        </div>

        <div className="services-metric-row">
          <span>Duração média:</span>
          <strong>{averageDuration}min</strong>
        </div>
      </article>

      <article className="services-sidecard services-sidecard-highlight">
        <div className="services-sidecard-title">
          <Flame size={18} />
          <h2>Serviço mais vendido</h2>
        </div>

        {!visibleServicesCount ? (
          <p>Nenhum serviço disponível.</p>
        ) : topService?.soldCount > 0 ? (
          <>
            <strong className="services-top-service-name">{topService.name}</strong>
            <p>
              {formatCurrency(topService.price)} | {formatDuration(topService.durationMinutes)}
            </p>
            <button type="button" className="services-secondary-button">
              <Calendar size={18} />
              Agendar
            </button>
          </>
        ) : (
          <p>Sem agendamentos vinculados aos serviços ainda.</p>
        )}
      </article>

      <article className="services-sidecard">
        <div className="services-sidecard-title">
          <h2>Ações rápidas</h2>
        </div>

        <button type="button" className="services-quick-action">
          <Calendar size={18} />
          Agendar com serviço
        </button>

        <button type="button" className="services-quick-action">
          <Users size={18} />
          Gerenciar profissionais
        </button>

        <button type="button" className="services-quick-action">
          <Archive size={18} />
          Ver arquivados
        </button>
      </article>
    </aside>
  );
}
