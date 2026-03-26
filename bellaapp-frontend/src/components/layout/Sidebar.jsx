import {NavLink} from "react-router-dom";
import "../../styles/sidebar.css";
import logo from "../../assets/logo2.png";

export default function Sidebar(){
    return(
        <aside className="sidebar" >
            
            <div className="sidebar-header">
                <img className="sidebar-logo" src={logo} alt="logo"/>
            </div>
      
             <nav className="sidebar-nav">
                 <NavLink to="/" className="sidebar-link" end>
                 Dashboard
                 </NavLink>

                 <NavLink to="/agenda" className="sidebar-link">
                 Agenda
                </NavLink>

                <NavLink to="/clientes" className="sidebar-link">
                Clientes
                </NavLink>

                <NavLink to="/servicos" className="sidebar-link">
                Serviços
                </NavLink>

                <NavLink to="/profissionais" className="sidebar-link">
                Profissionais
                </NavLink>
      
            </nav>
         </aside>

    );
}