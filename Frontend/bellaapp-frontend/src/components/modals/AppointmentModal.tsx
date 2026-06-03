import type { ReactNode } from "react";
import FormModalShell from "./FormModalShell";
import AppointmentModel from "../../models/AppointmentModel";
import type { Appointment } from "../../types/entities";
import type { AppointmentUpdateHandler } from "../../types/profile";
import "../../styles/modals/appointment-modal.css";
import useAppointmentActions from "../../hooks/useAppointmentActions";

interface InfoFieldProps {
  label: string;
  value: ReactNode;
  fullWidth?: boolean;
}

interface AppointmentModalProps {
  appointment: Nullable<Appointment>;
  onClose: () => void;
  onUpdate?: AppointmentUpdateHandler;
  onRequestReschedule?: () => void;
  onRequestReceive?: () => void;
}

function InfoField({ label, value, fullWidth = false }: InfoFieldProps) {
  return (
    <div className={`form-modal-field${fullWidth ? " form-modal-field-full" : ""}`}>
      <label>{label}</label>
      <div className="appointment-modal-value">{value ?? "-"}</div>
    </div>
  );
}

export default function AppointmentModal({
  appointment,
  onClose,
  onUpdate,
  onRequestReschedule,
  onRequestReceive,
}: AppointmentModalProps) {
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

  const appointmentModel = new AppointmentModel(appointment);
  const canConfirm = appointment.status === "pendente";
  const canCancel =
    appointment.status === "pendente" || appointment.status === "confirmado";
  const canReceive =
    appointment.status === "confirmado" ||
    (appointment.status === "concluido" && appointment.paymentStatus !== "pago");
  const canReschedule =
    appointment.status === "pendente" || appointment.status === "confirmado";

  return (
    <FormModalShell
      description="Verifique os detalhes do agendamento."
      onClose={onClose}
      size="compact"
      title="Detalhes do agendamento"
    >
      <div className="form-modal-form">
        <div className="form-modal-grid">
          <InfoField label="Cliente" value={appointmentModel.clientName} />
          <InfoField label="Serviço" value={appointmentModel.serviceName} />
          <InfoField label="Profissional" value={appointmentModel.professionalName} />
          <InfoField label="Sala" value={appointmentModel.roomName} />
          <InfoField label="Data" value={appointmentModel.formattedDate} />
          <InfoField label="Horário" value={appointmentModel.hour} />
          <InfoField label="Status" value={appointmentModel.statusLabel} />
          <InfoField
            label="Observações"
            value={appointmentModel.notesLabel}
            fullWidth
          />
        </div>

        <div className="appointment-modal-highlight">
          <span>Valor estimado</span>
          <strong>{appointmentModel.estimatedValueLabel}</strong>
        </div>

        <div className="form-modal-footer">
          {onRequestReschedule && canReschedule ? (
            <button
              type="button"
              className="form-modal-button form-modal-button-secondary"
              onClick={onRequestReschedule}
              disabled={actionLoading}
            >
              Reagendar
            </button>
          ) : null}

          {canCancel ? (
            <button
              type="button"
              className="form-modal-button appointment-modal-button-danger"
              onClick={handleCancel}
              disabled={actionLoading}
            >
              {actionLoading ? "Cancelando..." : "Cancelar"}
            </button>
          ) : null}

          {canReceive && onRequestReceive ? (
            <button
              type="button"
              className="form-modal-button form-modal-button-primary"
              onClick={onRequestReceive}
              disabled={actionLoading}
            >
              Receber
            </button>
          ) : null}

          {canConfirm ? (
            <button
              type="button"
              className="form-modal-button form-modal-button-primary"
              onClick={handleConfirm}
              disabled={actionLoading}
            >
              {actionLoading ? "Confirmando..." : "Confirmar"}
            </button>
          ) : null}
        </div>
      </div>
    </FormModalShell>
  );
}
