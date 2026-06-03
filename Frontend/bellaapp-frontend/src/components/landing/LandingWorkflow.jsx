import { CheckCircle2 } from "lucide-react";

export default function LandingWorkflow({ steps, outcomes }) {
  return (
    <section className="landing-section landing-shell landing-workflow-section" id="fluxo">
      <div className="landing-section-heading">
        <span className="landing-kicker">Como funciona</span>
        <h2>Do setup ao ritmo do dia, a experiência foi pensada para ser direta.</h2>
        <p>
          A proposta é simples: reduzir atrito na operação e deixar o essencial acessível para quem precisa decidir e
          agir rápido.
        </p>
      </div>

      <div className="landing-workflow-grid">
        <div className="landing-step-list">
          {steps.map(({ icon: Icon, step, title, description }) => (
            <article className="landing-step-card" key={step}>
              <div className="landing-step-topline">
                <span className="landing-step-number">{step}</span>
                <span className="landing-icon-chip">
                  <Icon size={18} strokeWidth={2.2} />
                </span>
              </div>

              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>

        <aside className="landing-workflow-panel">
          <span className="landing-kicker">Resultado na prática</span>
          <h3>Uma rotina mais legível para quem atende e para quem gerencia.</h3>

          <div className="landing-outcome-list">
            {outcomes.map(({ icon: Icon, title, description }) => (
              <article className="landing-outcome-card" key={title}>
                <span className="landing-icon-chip landing-icon-chip-soft">
                  <Icon size={17} strokeWidth={2.2} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>

          <ul className="landing-panel-checks">
            <li>
              <CheckCircle2 size={17} strokeWidth={2.2} />
              <span>Visão central para agenda, pessoas e estrutura física.</span>
            </li>
            <li>
              <CheckCircle2 size={17} strokeWidth={2.2} />
              <span>Menos ruído operacional e mais clareza para priorizar o dia.</span>
            </li>
            <li>
              <CheckCircle2 size={17} strokeWidth={2.2} />
              <span>Melhor apresentação do sistema em contexto acadêmico e profissional.</span>
            </li>
          </ul>
        </aside>
      </div>
    </section>
  );
}