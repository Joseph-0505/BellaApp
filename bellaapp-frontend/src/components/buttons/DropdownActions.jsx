import { useEffect, useRef, useState } from "react";
import { actionClass } from "../../utils/appointmentActions";

export default function AppointmentActionsMenu({ actions, onAction }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="row-menu" ref={menuRef}>
      <button
        type="button"
        className="menu-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Abrir ações"
        aria-expanded={open}
      >
        ⋯
      </button>

      {open && (
        <div className="menu-dropdown">
          {actions.length === 0 ? (
            <button type="button" className="menu-item" disabled>
              Sem ação disponível
            </button>
          ) : (
            actions.map((action) => (
              <button
                key={action}
                type="button"
                className={"menu-item " + actionClass(action)}
                onClick={() => {
                  onAction?.(action);
                  setOpen(false);
                }}
              >
                {action}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}