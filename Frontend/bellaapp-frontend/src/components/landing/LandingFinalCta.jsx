import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function LandingFinalCta({ actions, isAuthenticated }) {
  return (
    <section className="landing-section landing-shell" id="cta">
      <div className="landing-cta-card">
        <div className="landing-cta-copy">
          <span className="landing-kicker">Pronta para sair do improviso?</span>
          <h2>Transforme o cuidado com a clínica em uma operação mais calma, clara e profissional.</h2>
          <p>
            {isAuthenticated
              ? "Sua conta já está ativa. Use a landing como vitrine pública e continue o fluxo do sistema quando quiser."
              : "O Bella App foi pensado para quem quer organizar a rotina com mais presença visual e mais consistência na execução."}
          </p>
        </div>

        <div className="landing-cta-actions">
          <Link className="landing-button landing-button-solid landing-button-large" to={actions.primaryTo}>
            {actions.ctaPrimaryLabel}
            <ArrowRight size={18} strokeWidth={2.4} />
          </Link>

          <Link className="landing-button landing-button-ghost landing-button-large" to={actions.secondaryTo}>
            {actions.ctaSecondaryLabel}
          </Link>
        </div>
      </div>

      <footer className="landing-footer">
        <p>Bella App. Agenda, clientes, serviços, profissionais e salas no mesmo compasso.</p>
        <div>
          <a href="#funcionalidades">Funcionalidades</a>
          <a href="#fluxo">Fluxo</a>
          <a href="#cta">Começar</a>
        </div>
      </footer>
    </section>
  );
}