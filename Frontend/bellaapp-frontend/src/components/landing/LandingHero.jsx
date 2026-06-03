import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

const heroChecklist = [
  "Agenda, clientes, serviços e salas no mesmo fluxo",
  "Visual limpo para operação diária e apresentação do projeto",
  "Base robusta para continuar evoluindo sem improviso",
];

const agendaItems = [
  { time: "09:00", title: "Limpeza de pele", meta: "Sala Rosé • Ana" },
  { time: "10:30", title: "Botox", meta: "Sala 2 • Dra. Bia" },
  { time: "14:00", title: "Retorno premium", meta: "Confirmado • Juliana" },
];

export default function LandingHero({ actions, isAuthenticated }) {
  return (
    <section className="landing-hero landing-shell">
      <div className="landing-hero-copy">
        <span className="landing-kicker">Sistema web para gestão estética</span>

        <h1>O backstage da sua clínica pode ser sofisticado sem ficar pesado.</h1>

        <p className="landing-lead">
          O Bella App organiza agenda, clientes, equipe, salas e serviços em uma experiência mais clara, suave e
          profissional para quem opera a clínica todos os dias.
        </p>

        <div className="landing-hero-actions">
          <Link className="landing-button landing-button-solid landing-button-large" to={actions.primaryTo}>
            {actions.primaryLabel}
            <ArrowRight size={18} strokeWidth={2.4} />
          </Link>

          <Link className="landing-button landing-button-ghost landing-button-large" to={actions.secondaryTo}>
            {actions.secondaryLabel}
          </Link>
        </div>

        {isAuthenticated ? <p className="landing-session-hint">Sua sessão está ativa. A home pública continua acessível.</p> : null}

        <ul className="landing-checklist">
          {heroChecklist.map((item) => (
            <li key={item}>
              <CheckCircle2 size={18} strokeWidth={2.2} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="landing-hero-visual" aria-hidden="true">
        <div className="landing-preview-panel">
          <div className="landing-preview-topbar">
            <span className="landing-preview-dot" />
            <span className="landing-preview-dot" />
            <span className="landing-preview-dot" />
          </div>

          <div className="landing-preview-headline">
            <div>
              <span className="landing-preview-label">Painel do dia</span>
              <strong>Operação viva, não improvisada</strong>
            </div>

            <span className="landing-mini-chip">
              <LayoutDashboard size={14} strokeWidth={2.2} />
              visão central
            </span>
          </div>

          <div className="landing-metric-grid">
            <article>
              <span>
                <CalendarDays size={16} strokeWidth={2.2} />
                Hoje
              </span>
              <strong>18</strong>
              <p>atendimentos mapeados</p>
            </article>

            <article>
              <span>
                <ShieldCheck size={16} strokeWidth={2.2} />
                Confirmados
              </span>
              <strong>12</strong>
              <p>fluxo principal do dia</p>
            </article>

            <article>
              <span>
                <Clock3 size={16} strokeWidth={2.2} />
                Pendências
              </span>
              <strong>3</strong>
              <p>pontos que pedem atenção</p>
            </article>
          </div>

          <div className="landing-preview-body">
            <section className="landing-agenda-card">
              <header>
                <span>Próximos horários</span>
                <strong>Agenda de terça</strong>
              </header>

              <ul>
                {agendaItems.map((item) => (
                  <li key={`${item.time}-${item.title}`}>
                    <span>{item.time}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.meta}</small>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <aside className="landing-focus-card">
              <span className="landing-kicker">Cliente em foco</span>
              <strong>Juliana M.</strong>
              <p>Retorno marcado, observação registrada e histórico pronto para consulta.</p>

              <div className="landing-tag-row">
                <span>retorno premium</span>
                <span>cliente ativa</span>
                <span>sala definida</span>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}