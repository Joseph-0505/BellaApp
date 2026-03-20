import { Link } from "react-router-dom";
import formatCurrency  from "../../utils/formatters";


export default function DashboardHeader({ totalAtendimentos, faturamentoPrevisto }) {
  return (
    <header className="dash-header">
      <div>
        <h1>Painel da Clinica</h1>
        <p>
          Hoje voce tem {totalAtendimentos} atendimentos e faturamento previsto de{" "}
          {formatCurrency(faturamentoPrevisto)}.
        </p>
      </div>

      <div className="dash-actions">
        <Link to="/agenda" className="btn-primary">
          Novo agendamento
        </Link>
        <Link to="/clientes" className="btn-soft">
          Novo cliente
        </Link>
      </div>
    </header>
  );
}