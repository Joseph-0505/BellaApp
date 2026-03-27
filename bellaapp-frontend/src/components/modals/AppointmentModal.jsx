import FormModalShell from "./FormModalShell";
import formatCurrency from "../../utils/formatters";
import "../../styles/modals/appointment-modal.css";

import useAppointmentActions from "../../hooks/useAppointmentActions.js";
import useReschedule from "../../hooks/useReschedule.js";

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
  appointments = [],
  hours = [],
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

  const {
    mode,
    availableDays,
    daySlots,
    selectedDay,
    selectedHour,
    loading: rescheduleLoading,
    startReschedule,
    cancelReschedule,
    selectDay,
    selectSlot,
    saveReschedule,
  } = useReschedule({
    appointment,
    onUpdate,
    onClose,
    appointments,
    hours,
  });

  if (!appointment) {
    return null;
  }

  const isRescheduling = mode === "reschedule";
  const title =  "Detalhes do agendamento";
  const description = isRescheduling ? "Selecione uma nova data e horário para o atendimento atual." : title
  ? "verifique os detalhes do agendamento." : "";
    
  return (
    <FormModalShell description={description} onClose={onClose} size="compact" title={title}>
      {isRescheduling ? (
        <div className="form-modal-form">
          <div className="appointment-modal-summary">
            <strong>{appointment.cliente}</strong>
            <span>
              {appointment.servico} | {formatDate(appointment.day)} | {appointment.hour}
            </span>
          </div>

          <div className="appointment-modal-section">
            <h3>Escolha um dia</h3>

            <div className="days-grid">
              {availableDays.map((day) => {
                const isSelected = selectedDay === day.key;

                return (
                  <button
                    type="button"
                    key={day.key}
                    className={`slot-btn ${isSelected ? "selected" : ""}`}
                    onClick={() => selectDay(day.key)}
                    disabled={day.count === 0}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="appointment-modal-section">
            <h3>Escolha um novo horário</h3>

            {selectedDay && daySlots.length > 0 ? (
              <div className="slots-grid">
                {daySlots.map((slot) => {
                  const isSelected = selectedDay === slot.day && selectedHour === slot.hour;

                  return (
                    <button
                      type="button"
                      key={`${slot.day}-${slot.hour}`}
                      className={`slot-btn ${isSelected ? "selected" : ""}`}
                      onClick={() => selectSlot(slot.day, slot.hour)}
                    >
                      {slot.hour}
                    </button>
                  );
                })}
              </div>
            ) : selectedDay ? (
              <p className="appointment-modal-empty">Nenhum horário disponível para este dia.</p>
            ) : (
              <p className="appointment-modal-empty">Selecione um dia para ver os horários livres.</p>
            )}
          </div>

          <div className="form-modal-footer">
            <button
              type="button"
              className="form-modal-button form-modal-button-secondary"
              onClick={cancelReschedule}
              disabled={rescheduleLoading}
            >
              Voltar
            </button>

            <button
              type="button"
              className="form-modal-button form-modal-button-primary"
              onClick={saveReschedule}
              disabled={rescheduleLoading || !selectedDay || !selectedHour}
            >
              {rescheduleLoading ? "Salvando..." : "Confirmar reagendamento"}
            </button>
          </div>
        </div>
      ) : (
        <div className="form-modal-form">
          <div className="form-modal-grid">
            <InfoField label="Cliente" value={appointment.cliente} />
            <InfoField label="Serviço" value={appointment.servico} />
            <InfoField label="Profissional" value={appointment.profissional || "Nao vinculado"} />
            <InfoField label="Data" value={formatDate(appointment.day)} />
            <InfoField label="Horário" value={appointment.hour} />
            <InfoField label="Status" value={statusLabel(appointment.status)} />
            <InfoField
              label="Observações"
              value={appointment.observacoes || "Sem observações registradas."}
              fullWidth
            />
          </div>

          <div className="appointment-modal-highlight">
            <span>Valor estimado</span>
            <strong>{formatCurrency(appointment.valorEstimado)}</strong>
          </div>

          <div className="form-modal-footer">
            <button
              type="button"
              className="form-modal-button form-modal-button-secondary"
              onClick={startReschedule}
              disabled={actionLoading}
            >
              Reagendar
            </button>

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
      )}
    </FormModalShell>
  );
}
