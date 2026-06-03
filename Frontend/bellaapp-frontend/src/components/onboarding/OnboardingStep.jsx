export default function OnboardingStep({ children, description, eyebrow, title }) {
  return (
    <section className="onboarding-step">
      {eyebrow ? <span className="onboarding-step-eyebrow">{eyebrow}</span> : null}
      <div className="onboarding-step-copy">
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="onboarding-step-body">{children}</div>
    </section>
  );
}
