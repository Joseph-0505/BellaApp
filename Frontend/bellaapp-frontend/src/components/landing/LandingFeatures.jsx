export default function LandingFeatures({ features }) {
  return (
    <section className="landing-section landing-shell" id="funcionalidades">
      <div className="landing-section-heading">
        <span className="landing-kicker">Funcionalidades</span>
        <h2>Recursos desenhados para fazer a operação respirar melhor.</h2>
        <p>
          Não é só um painel bonito. É uma estrutura para organizar rotina, diminuir ruído operacional e sustentar a
          experiência da clínica com mais consistência.
        </p>
      </div>

      <div className="landing-feature-grid">
        {features.map(({ icon: Icon, title, description, bullets }) => (
          <article className="landing-feature-card" key={title}>
            <span className="landing-icon-chip landing-icon-chip-strong">
              <Icon size={18} strokeWidth={2.2} />
            </span>

            <h3>{title}</h3>
            <p>{description}</p>

            <ul>
              {bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}