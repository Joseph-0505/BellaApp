import formatCurrency from "../../utils/formatters";

export default function AgendaSummary({ resumo = {} }) {
  return (
    <div className="panel agenda-panel-content">
      <h2>Resumo da semana</h2>

      <div className="agenda-summary-grid">
        <p className="agenda-item-row">
          Atendimentos: <strong>{resumo.totalAtendimentos || 0}</strong>
        </p>

        <p className="agenda-item-row">
          Confirmados: <strong>{resumo.confirmados || 0}</strong>
        </p>

        <p className="agenda-item-row">
          Pendentes: <strong>{resumo.pendentes || 0}</strong>
        </p>

        <p className="agenda-item-row">
          Risco alto: <strong>{resumo.riscoAlto || 0}</strong>
        </p>

        <p className="agenda-item-row">
          Livres: <strong>{resumo.livresTotal || 0}</strong>
        </p>

        <p className="agenda-item-row">
          Ocupação: <strong>{resumo.taxaOcupacao || 0}%</strong>
        </p>

        <p>
          Receita projetada: <strong>{formatCurrency(resumo.receitaProjetada)}</strong>
        </p>
      </div>
    </div>
  );
}
