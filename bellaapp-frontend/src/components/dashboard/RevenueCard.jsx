import formatCurrency from "../../utils/formatters";
import "../../styles/dashboard/revenue-card.css";

const DEFAULT_DAILY_TARGET = 3000;

function getLevel(percentual) {
  if (percentual >= 80) return "bom";
  if (percentual >= 50) return "atencao";
  return "critico";
}

function getLevelLabel(level) {
  if (level === "bom") return "Meta bem encaminhada";
  if (level === "atencao") return "Atenção na meta";
  return "Risco de não bater meta";
}

export default function RevenueCard({ previsto, recebido, atualizadoEm, metaDiaria }) {
  const prev = Number(previsto || 0);
  const rec = Number(recebido || 0);
  const meta = Number(metaDiaria || DEFAULT_DAILY_TARGET);

  const falta = Math.max(meta - rec, 0);
  const percentualMeta = meta > 0 ? Math.min((rec / meta) * 100, 100) : 0;
  const diferencaPrevisto = rec - prev;
  const level = getLevel(percentualMeta);

  return (
    <article className={"panel revenue-card revenue-card-" + level}>
      <div className="panel-header">
        <h2>Faturamento de hoje</h2>
        <span className={"revenue-state " + level}>{getLevelLabel(level)}</span>
      </div>

      <div className="revenue-grid">
        <div>
          <p className="muted">Recebido</p>
          <strong className="revenue-value">{formatCurrency(rec)}</strong>
        </div>

        <div>
          <p className="muted">Meta diária</p>
          <strong className="revenue-value">{formatCurrency(meta)}</strong>
        </div>

        <div>
          <p className="muted">Previsto</p>
          <strong className="revenue-value">{formatCurrency(prev)}</strong>
        </div>

        <div>
          <p className="muted">Falta para meta</p>
          <strong className="revenue-value">{formatCurrency(falta)}</strong>
        </div>
      </div>

      <div className="meta-progress">
        <div className="meta-progress-head">
          <span>Progresso da meta</span>
          <strong>{percentualMeta.toFixed(1) + "%"}</strong>
        </div>
        <div className="meta-progress-track">
          <span className={"meta-progress-fill " + level} style={{ width: percentualMeta + "%" }} />
        </div>
      </div>

      <p className={"delta-previsto " + (diferencaPrevisto >= 0 ? "up" : "down")}>
        {diferencaPrevisto >= 0 ? "Acima do previsto em " : "Abaixo do previsto em "}
        {formatCurrency(Math.abs(diferencaPrevisto))}
      </p>

      <p className="updated-at">
        Última atualização:{" "}
        {atualizadoEm ? new Date(atualizadoEm).toLocaleTimeString("pt-BR") : "--:--"}
      </p>
    </article>
  );
}