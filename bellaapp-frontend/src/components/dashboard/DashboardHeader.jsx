import formatCurrency from "../../utils/formatters";
import Header from "../layout/Header";
import "../../styles/botoes/novo-agendamento.css";
import "../../styles/botoes/novo-cliente.css";

export default function DashboardHeader({
  faturamentoPrevisto,
  nomeClinica,
  onNewAppointment,
  onNewClient,
  totalAtendimentos,
}) {
  return (
    <Header
      title={nomeClinica || "Painel da Clinica"}
      subtitle={`Hoje você tem ${totalAtendimentos} atendimentos e faturamento previsto de ${formatCurrency(faturamentoPrevisto)}.`}
      actions={
        <>
          <button type="button" className="btn-primary" onClick={onNewAppointment}>
            Novo Agendamento
          </button>
          <button type="button" className="btn-soft" onClick={onNewClient}>
            Novo Cliente
          </button>
        </>
      }
    />
  );
}
