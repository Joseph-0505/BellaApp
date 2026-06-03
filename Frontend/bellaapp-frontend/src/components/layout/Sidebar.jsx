import { Briefcase, Calendar, ChevronLeft, CircleUserRound, DoorClosed, Home, LogOut, User, Users, Wallet } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { logout } from "../../services/authService";
import { showConfirmAlert } from "../../utils/alerts";
import logo from "../../assets/logo.png";
import logo2 from "../../assets/logo2.png";
import "../../styles/layout/sidebar.css";

function buildInitials(name) {
  const initials = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "BA";
}

export default function Sidebar({ collapsed = false, onToggle = () => {} }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const profileName = user?.businessProfile?.businessName || user?.name || "Minha conta";
  const profileEmail = user?.email || "";
  const profileInitials = buildInitials(profileName);

  async function handleLogout() {
    const shouldLogout = await showConfirmAlert({
      title: "Tem certeza que quer sair mesmo?",
      text: "Sua sessão atual será encerrada.",
      confirmButtonText: "Sair",
      cancelButtonText: "Continuar aqui",
    });

    if (!shouldLogout) {
      return;
    }

    logout();
    navigate("/login", { replace: true });
  }

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

        <NavLink to="/servicos" className="sidebar-link" aria-label="Serviços">
          <Briefcase size={18} />
          {!collapsed && "Serviços"}
        </NavLink>

        <NavLink to="/rooms" className="sidebar-link" aria-label="Salas">
          <DoorClosed size={18} />
          {!collapsed && "Salas"}
        </NavLink>

        <NavLink to="/profissionais" className="sidebar-link" aria-label="Profissionais">
          <User size={18} />
          {!collapsed && "Profissionais"}
        </NavLink>

         <NavLink to="/caixa" className="sidebar-link" aria-label="Caixa">
          <Wallet size={18} />
          {!collapsed && "Caixa"}
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/perfil" className="sidebar-user-card" aria-label="Meu perfil">
          <span className="sidebar-user-avatar">{collapsed ? <CircleUserRound size={18} /> : profileInitials}</span>

          {!collapsed ? (
            <span className="sidebar-user-text">
              <strong>{profileName}</strong>
              <small>{profileEmail || "Sem email cadastrado"}</small>
            </span>
          ) : null}
        </NavLink>

        <button type="button" className="sidebar-link" aria-label="Sair" onClick={handleLogout}>
          <LogOut size={18} />
          {!collapsed && "Sair"}
        </button>
      </div>
    </aside>
  );
}
