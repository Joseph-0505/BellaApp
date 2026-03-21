import formatCurrency  from "../../utils/formatters";
import LinkButton from "../buttons/LinkButton";
import Header from "../layout/Header";


export default function DashboardHeader({ totalAtendimentos, faturamentoPrevisto, nomeClinica }) {
  return (
    <Header
      title={nomeClinica || "Painel da Clínica"}
      subtitle={`Hoje você tem ${totalAtendimentos} atendimentos e faturamento previsto de ${formatCurrency(faturamentoPrevisto)}.`}
      actions={
        <>
          <LinkButton to="/agendamento" className="btn-primary">
            Novo Agendamento
          </LinkButton>
          <LinkButton to="/cliente" className="btn-soft">
            Novo Cliente
          </LinkButton>
        </>
      }
    />
  );
}