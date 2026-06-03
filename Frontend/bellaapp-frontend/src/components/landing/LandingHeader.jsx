import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo2.png";

export default function LandingHeader({ actions, isAuthenticated }) {
  return (
    <header className="landing-header">
      <div className="landing-shell landing-header-inner">
        <Link className="landing-brand" to="/">
          <img src={logo} alt="Bella App" className="landing-brand-logo" />
          <div className="landing-brand-copy">
            <span>Gestão elegante para clínicas e espaços de estética</span>
          </div>
        </Link>

        <nav className="landing-nav" aria-label="Navegação da landing page">
          <a href="#funcionalidades">Funcionalidades</a>
          <a href="#fluxo">Fluxo</a>
          <a href="#cta">Começar</a>
        </nav>

        <div className="landing-header-actions">
          <Link className="landing-button landing-button-ghost" to={actions.secondaryTo}>
            {actions.secondaryLabel}
          </Link>

          <Link className="landing-button landing-button-solid" to={actions.primaryTo}>
            {isAuthenticated ? "Continuar" : "Criar conta"}
            <ArrowRight size={16} strokeWidth={2.4} />
          </Link>
        </div>
      </div>
    </header>
  );
}