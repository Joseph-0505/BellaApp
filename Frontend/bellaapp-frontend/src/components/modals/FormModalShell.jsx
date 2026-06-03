import { useEffect } from "react";

import useEscClose from "../../hooks/useEscClose";
import "../../styles/modals/form-modal.css";

export default function FormModalShell({ children, description, onClose, size = "default", title }) {
  useEscClose(onClose);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="form-modal-overlay" onClick={onClose}>
      <div
        className={`form-modal-card ${size !== "default" ? `form-modal-card-${size}` : ""}`.trim()}
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
