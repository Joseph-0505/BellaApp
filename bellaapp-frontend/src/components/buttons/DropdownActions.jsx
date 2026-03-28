import { createPortal } from "react-dom";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { actionClass } from "../../utils/appointmentActions";

const VIEWPORT_GAP = 12;
const TRIGGER_OFFSET = 8;
const FALLBACK_MENU_WIDTH = 210;

export default function AppointmentActionsMenu({ actions, onAction }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    placement: "bottom",
  });
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const updatePosition = useCallback(() => {
    const triggerEl = triggerRef.current;
    if (!triggerEl) {
      return;
    }

    const triggerRect = triggerEl.getBoundingClientRect();
    const dropdownEl = dropdownRef.current;
    const menuHeight = dropdownEl?.offsetHeight ?? 0;
    const menuWidth = dropdownEl?.offsetWidth ?? FALLBACK_MENU_WIDTH;
    const left = Math.max(
      VIEWPORT_GAP + menuWidth,
      Math.min(triggerRect.right, window.innerWidth - VIEWPORT_GAP),
    );

    const shouldOpenUp =
      menuHeight > 0 &&
      window.innerHeight - triggerRect.bottom < menuHeight + VIEWPORT_GAP &&
      triggerRect.top >= menuHeight + TRIGGER_OFFSET + VIEWPORT_GAP;

    setPosition({
      top: shouldOpenUp ? triggerRect.top - TRIGGER_OFFSET : triggerRect.bottom + TRIGGER_OFFSET,
      left,
      placement: shouldOpenUp ? "top" : "bottom",
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClickOutside(event) {
      const clickedTrigger = containerRef.current?.contains(event.target);
      const clickedDropdown = dropdownRef.current?.contains(event.target);

      if (!clickedTrigger && !clickedDropdown) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    function handleViewportChange() {
      updatePosition();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open, updatePosition]);

  const dropdown =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={dropdownRef}
            className={`menu-dropdown${position.placement === "top" ? " is-top" : ""}`}
            role="menu"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
          >
            {actions.length === 0 ? (
              <button type="button" className="menu-item" disabled>
                {"Sem a\u00e7\u00e3o dispon\u00edvel"}
              </button>
            ) : (
              actions.map((action) => (
                <button
                  key={action}
                  type="button"
                  className={"menu-item " + actionClass(action)}
                  role="menuitem"
                  onClick={() => {
                    onAction?.(action);
                    setOpen(false);
                  }}
                >
                  {action}
                </button>
              ))
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="row-menu" ref={containerRef}>
        <button
          ref={triggerRef}
          type="button"
          className="menu-trigger"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={"Abrir a\u00e7\u00f5es"}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          {"\u22ef"}
        </button>
      </div>

      {dropdown}
    </>
  );
}
