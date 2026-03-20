import formatCurrency from "../../utils/formatters";
import "../../styles/dashboard/revenue-card.css";
const DAILY_TARGET = 3000;

export default function RevenueCard({ previsto, recebido, atualizadoEm }) {
  const falta = Math.max(DAILY_TARGET - Number(recebido || 0), 0);

  return (
    <article className="panel revenue-card">
      <div className="panel-header">
        <h2>Faturamento de hoje</h2>
        <span className="live-pill">
          <span className="live-dot" />
          Atualizando
        </span>
      </div>

      <div className="revenue-grid">
        <div>
          <p className="muted">Previsto</p>
          <strong className="revenue-value">{formatCurrency(previsto)}</strong>
        </div>

        <div>
          <p className="muted">Recebido</p>
          <strong className="revenue-value">{formatCurrency(recebido)}</strong>
        </div>

        <div>
          <p className="muted">Meta diária</p>
          <strong className="revenue-value">{formatCurrency(DAILY_TARGET)}</strong>
        </div>

        <div>
          <p className="muted">Falta para meta</p>
          <strong className="revenue-value">{formatCurrency(falta)}</strong>
        </div>
      </div>

      <p className="updated-at">
        Ultima atualizacao:{" "}
        {atualizadoEm ? new Date(atualizadoEm).toLocaleTimeString("pt-BR") : "--:--"}
      </p>
    </article>
  );
}