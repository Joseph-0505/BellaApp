import formatCurrency  from "../../utils/formatters";
import NovoAgendamentoBtn from "../buttons/NovoAgendamentoBtn";
import NovoClienteBtn from "../buttons/NovoClienteBtn";


export default function DashboardHeader({ totalAtendimentos, faturamentoPrevisto, nomeClinica }) {
  return (
    <header className="dash-header">
      <div>
        <h1>{nomeClinica || "Painel da Clínica"}</h1>
        <p>
          Hoje você tem {totalAtendimentos} atendimentos e faturamento previsto de{" "}
          {formatCurrency(faturamentoPrevisto)}.
        </p>
      </div>

      <div className="dash-actions">
          <NovoAgendamentoBtn/>
          <NovoClienteBtn/>
      </div>
    </header>
  );
}