import { Link } from "react-router-dom";
import "../../styles/botoes/novo-cliente.css";

export default function NovoClienteBtn(){
    return(
          <Link to="/clientes" className="btn-soft">
          Novo cliente
        </Link>
    );
}