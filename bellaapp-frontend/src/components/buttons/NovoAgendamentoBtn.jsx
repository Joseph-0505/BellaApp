import { Link } from "react-router-dom";
import "../../styles/botoes/novo-agendamento.css";

export default function NovoAgendamentoBtn(){
    return(
         <Link to="/agenda" className="btn-primary">
          Novo agendamento
        </Link>
    );
}