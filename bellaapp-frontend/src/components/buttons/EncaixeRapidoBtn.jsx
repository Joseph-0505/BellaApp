import { Link } from "react-router-dom";
import "../../styles/botoes/novo-cliente.css";

export default function EncaixeRapidoBtn(){
    return(
          <Link to="/clientes" className="btn-soft">
           Encaixe rápido
          </Link>
    );
}