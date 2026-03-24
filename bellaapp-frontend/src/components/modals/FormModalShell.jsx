import useEscClose from "../../hooks/useEscClose";
import "../../styles/modals/form-modal.css";

export default function FormModalShell({
  children,
  description,
  onClose,
  size = "default",
  title,
}) {
  useEscClose(onClose);

  return (
    <div className="form-modal-overlay" onClick={onClose}>
      <div
        className={`form-modal-card ${size === "compact" ? "form-modal-card-compact" : ""}`.trim()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="form-modal-header">
          <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>

          <button type="button" className="form-modal-close" aria-label="Fechar modal" onClick={onClose}>
            x
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
