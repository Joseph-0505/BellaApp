import "../../styles/botoes/novo-cliente.css";
import "../../styles/botoes/novo-agendamento.css";


export default function LinkButton({to, children, className}){
   
    return(
        <button to={to} className={className}>
            {children}
        </button> 
    );
}