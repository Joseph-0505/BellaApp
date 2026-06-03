import { ArrowRight, CalendarPlus, CheckCircle2, Circle, Scissors, UserPlus } from "lucide-react";

const ITEM_ICONS = {
  appointment: CalendarPlus,
  client: UserPlus,
  service: Scissors,
};

function ChecklistItem({ actionLabel, completed, description, id, onAction, title }) {
  const Icon = ITEM_ICONS[id] || Circle;

  return (
    <li className={`dashboard-checklist-item ${completed ? "is-completed" : ""}`}>
      <div className="dashboard-checklist-item-state" aria-hidden="true">
        {completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
      </div>

      <div className="dashboard-checklist-item-content">
        <div className="dashboard-checklist-item-copy">
          <span className="dashboard-checklist-item-icon">
            <Icon size={16} />
          </span>
          <div>
            <strong>{title}</strong>
            <p>{description}</p>
          </div>
        </div>

        <button
          type="button"
          className={`dashboard-checklist-action ${completed ? "is-disabled" : ""}`}
          onClick={() => onAction?.(id)}
          disabled={completed}
        >
          <span>{completed ? "Concluido" : actionLabel}</span>
          {!completed ? <ArrowRight size={15} /> : null}
        </button>
      </div>
    </li>
  );
}

export default function OnboardingChecklist({
  completedCount = 0,
  items = [],
  loading = false,
  onAction,
}) {
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <article className="panel onboarding-checklist">
      <div className="dashboard-checklist-header">
        <div>
          <span className="dashboard-checklist-kicker">Onboarding progressivo</span>
          <h2>Vamos configurar sua clinica</h2>
          <p>
            {loading
              ? "Verificando os primeiros passos da sua clinica."
              : completedCount === totalCount
                ? "Tudo pronto. Sua base operacional essencial ja foi configurada."
                : `Conclua ${totalCount - completedCount} passo(s) para liberar sua operacao inicial.`}
          </p>
        </div>

        <div className="dashboard-checklist-progress">
          <strong>
            {completedCount}/{totalCount || 3}
          </strong>
          <span>etapas concluidas</span>
        </div>
      </div>

      <div className="dashboard-checklist-bar" aria-hidden="true">
        <span style={{ width: `${loading ? 20 : progressPercent}%` }} />
      </div>

      {loading ? (
        <p className="dashboard-checklist-loading">Carregando checklist...</p>
      ) : (
        <ul className="dashboard-checklist-list">
          {items.map((item) => (
            <ChecklistItem key={item.id} {...item} onAction={onAction} />
          ))}
        </ul>
      )}
    </article>
  );
}
