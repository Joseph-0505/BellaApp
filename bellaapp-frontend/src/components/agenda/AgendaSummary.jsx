export default function AgendaSummary({ resumo }) {
  return (
    <div className="panel agenda-panel-content">
      <h2>Resumo do dia</h2>

      <p className="agenda-item-row">
        Receita projetada: R$ {resumo.receitaProjetada}
      </p>

      <p className="agenda-item-row">
        Risco alto: {resumo.riscoAlto}
      </p>

      <p>
        Pendentes: {resumo.pendentes}
      </p>
    </div>
  );
}