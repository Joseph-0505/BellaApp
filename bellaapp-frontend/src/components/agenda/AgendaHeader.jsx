import NovoAgendamentoBtn from "../../components/buttons/NovoAgendamentoBtn";
import NovoClienteBtn from "../../components/buttons/NovoClienteBtn";
import EncaixeRapidoBtn from "../../components/buttons/EncaixeRapidoBtn";

export default function AgendaHeader(){
    return(
         <header className="dash-header">
        <div>
          <h1>Agenda</h1>
          <p>Semana de 22 a 28 de abril de 2024</p>
        </div>

        <div className="dash-actions">
          <NovoAgendamentoBtn />
          <NovoClienteBtn />
          <EncaixeRapidoBtn />
        </div>
      </header>
    );
}