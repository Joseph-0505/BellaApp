import formatCurrency from "../../utils/formatters";

export default function AgendaSummary({ resumo = {} }) {
  const occupancy = Math.max(0, Math.min(100, Number(resumo.taxaOcupacao || 0)));
  const metrics = [
    { label: "Atendimentos", value: resumo.totalAtendimentos || 0 },
    { label: "Confirmados", value: resumo.confirmados || 0 },
    { label: "Pendentes", value: resumo.pendentes || 0 },
    { label: "Livres", value: resumo.livresTotal || 0 },
  ];

  return (
    <div className="panel agenda-panel-content agenda-summary-panel">
      <div className="agenda-summary-head">
        <div>
          <p className="agenda-summary-eyebrow">Resumo da semana</p>
          <h2>Painel da agenda</h2>
        </div>
        <span className="agenda-summary-badge">{occupancy}% ocupada</span>
      </div>

      {/* Revenue gets a hero treatment so the sidebar is readable in one quick scan. */}
      <div className="agenda-summary-revenue">
        <span className="agenda-summary-label">Receita projetada</span>
        <strong className="agenda-summary-amount">{formatCurrency(resumo.receitaProjetada)}</strong>
      </div>

      <div className="agenda-summary-grid">
        {metrics.map((metric) => (
          <div className="agenda-summary-stat" key={metric.label}>
            <span className="agenda-summary-stat-label">{metric.label}</span>
            <strong className="agenda-summary-stat-value">{metric.value}</strong>
          </div>
        ))}
      </div>

      <div className="agenda-summary-progress-block">
        <div className="agenda-summary-progress-head">
          <span>Ocupacao da semana</span>
          <strong>{occupancy}%</strong>
        </div>

        <div className="agenda-summary-progress" aria-hidden="true">
          <span style={{ width: `${occupancy}%` }} />
        </div>
      </div>
    </div>
  );
}
