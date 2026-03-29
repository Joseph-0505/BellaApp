import { NavLink } from "react-router-dom";
import { Home, Calendar, Users, Briefcase, User, ChevronLeft, LogOut } from "lucide-react";
import "../../styles/sidebar.css";
import logo from "../../assets/logo.png";
import logo2 from "../../assets/logo2.png";

export default function Sidebar({ collapsed = false, onToggle = () => {} }) {
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <img
          className={`sidebar-logo ${collapsed ? "sidebar-logo-collapsed" : ""}`}
          src={collapsed ? logo : logo2}
          alt="Bella App"
        />
      </div>

      <button
        type="button"
        className="edge-menu-btn"
        onClick={onToggle}
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        aria-pressed={collapsed}
      >
        <ChevronLeft
          size={18}
          style={{
            transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
            transition: "0.3s",
          }}
        />
      </button>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className="sidebar-link" end aria-label="Dashboard">
          <Home size={18} />
          {!collapsed && "Dashboard"}
        </NavLink>

        <NavLink to="/agenda" className="sidebar-link" aria-label="Agenda">
          <Calendar size={18} />
          {!collapsed && "Agenda"}
        </NavLink>

        <NavLink to="/clientes" className="sidebar-link" aria-label="Clientes">
          <Users size={18} />
          {!collapsed && "Clientes"}
        </NavLink>

        <NavLink to="/servicos" className="sidebar-link" aria-label="Servicos">
          <Briefcase size={18} />
          {!collapsed && "Servicos"}
        </NavLink>

        <NavLink to="/profissionais" className="sidebar-link" aria-label="Profissionais">
          <User size={18} />
          {!collapsed && "Profissionais"}
        </NavLink>

        <NavLink to="/logout" className="sidebar-link" aria-label="Sair">
         <LogOut size={18}/>
          {!collapsed && "Sair"}
        </NavLink>
      </nav>
    </aside>
  );
}
