import {Link} from "react-router-dom";
import "../../styles/botoes/novo-cliente.css";
import "../../styles/botoes/novo-agendamento.css";

export default function LinkButton({to, children, className}){
    return(
        <Link to={to} className={className}>
            {children}
        </Link> 
    );
}