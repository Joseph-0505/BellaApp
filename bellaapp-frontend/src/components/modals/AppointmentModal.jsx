import FormModalShell from "./FormModalShell";
import formatCurrency from "../../utils/formatters";
import "../../styles/modals/appointment-modal.css";

import useAppointmentActions from "../../hooks/useAppointmentActions.js";

const STATUS_LABELS = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  concluido: "Concluido",
  cancelado: "Cancelado",
};

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T12:00:00`));
}

function statusLabel(status) {
  return STATUS_LABELS[status] || status || "-";
}

function InfoField({ label, value, fullWidth = false }) {
  return (
    <div className={`form-modal-field${fullWidth ? " form-modal-field-full" : ""}`}>
      <label>{label}</label>
      <div className="appointment-modal-value">{value || "-"}</div>
    </div>
  );
}

export default function AppointmentModal({
  appointment,
  onClose,
  onUpdate,
  onRequestReschedule,
}) {
  const {
    loading: actionLoading,
    handleConfirm,
    handleCancel,
  } = useAppointmentActions({
    appointment,
    onUpdate,
    onClose,
  });

  if (!appointment) {
    return null;
  }

  return (
    <FormModalShell
      description="Verifique os detalhes do agendamento."
      onClose={onClose}
      size="compact"
      title="Detalhes do agendamento"
    >
      <div className="form-modal-form">
        <div className="form-modal-grid">
          <InfoField label="Cliente" value={appointment.cliente} />
          <InfoField label="Servico" value={appointment.servico} />
          <InfoField label="Profissional" value={appointment.profissional || "Nao vinculado"} />
          <InfoField label="Data" value={formatDate(appointment.day)} />
          <InfoField label="Horario" value={appointment.hour} />
          <InfoField label="Status" value={statusLabel(appointment.status)} />
          <InfoField
            label="Observacoes"
            value={appointment.observacoes || "Sem observacoes registradas."}
            fullWidth
          />
        </div>

        <div className="appointment-modal-highlight">
          <span>Valor estimado</span>
          <strong>{formatCurrency(appointment.valorEstimado)}</strong>
        </div>

        <div className="form-modal-footer">
          {onRequestReschedule ? (
            <button
              type="button"
              className="form-modal-button form-modal-button-secondary"
              onClick={onRequestReschedule}
              disabled={actionLoading}
            >
              Reagendar
            </button>
          ) : null}

          <button
            type="button"
            className="form-modal-button appointment-modal-button-danger"
            onClick={handleCancel}
            disabled={actionLoading}
          >
            {actionLoading ? "Cancelando..." : "Cancelar"}
          </button>

          <button
            type="button"
            className="form-modal-button form-modal-button-primary"
            onClick={handleConfirm}
            disabled={actionLoading}
          >
            {actionLoading ? "Confirmando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </FormModalShell>
  );
}
