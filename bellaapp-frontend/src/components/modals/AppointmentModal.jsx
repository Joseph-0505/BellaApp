import "../../styles/modals/appointment-modal.css";
import formatCurrency from "../../utils/formatters.js";

import useAppointmentActions from "../../hooks/useAppointmentActions.js";
import useEscClose from "../../hooks/useEscClose.js";
import useReschedule from "../../hooks/useReschedule.js";

export default function AppointmentModal({
  appointment,
  onClose,
  onUpdate,
  appointments = [],
  hours = [],
}) {
  useEscClose(onClose);

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

  if (!appointment) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content premium-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{appointment.cliente}</h2>
          <span className={`status-badge ${appointment.status}`}>
            {appointment.status}
          </span>
        </div>

        {mode === "view" && (
          <>
            <div className="modal-body">
              <div className="info-group">
                <p>
                  <strong>Serviço</strong>
                </p>
                <span>{appointment.servico}</span>
              </div>

              <div className="info-group">
                <p>
                  <strong>Profissional</strong>
                </p>
                <span>{appointment.profissional}</span>
              </div>

              <div className="info-group">
                <p>
                  <strong>Recurso</strong>
                </p>
                <span>{appointment.recurso}</span>
              </div>
            </div>

            <div className="modal-highlight">
              <span>Valor do atendimento </span>
              <strong>{formatCurrency(appointment.valorEstimado)}</strong>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-success"
                onClick={handleConfirm}
                disabled={actionLoading}
              >
                {actionLoading ? "Confirmando..." : "Confirmar"}
              </button>

              <button
                className="btn btn-warning"
                onClick={startReschedule}
              >
                Reagendar
              </button>

              <button
                className="btn btn-danger"
                onClick={handleCancel}
                disabled={actionLoading}
              >
                Cancelar
              </button>
            </div>
          </>
        )}

        {mode === "reschedule" && (
          <div className="reschedule-box">
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

            <h3>Escolha um novo horário</h3>

            {selectedDay && daySlots.length > 0 ? (
              <div className="slots-grid">
                {daySlots.map((slot) => {
                  const isSelected =
                    selectedDay === slot.day &&
                    selectedHour === slot.hour;

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
              <p>Nenhum horário disponível para este dia.</p>
            ) : (
              <p>Selecione um dia para ver os horários livres.</p>
            )}

            <div className="modal-actions">
              <button
                className="btn btn-success"
                onClick={saveReschedule}
                disabled={rescheduleLoading || !selectedDay || !selectedHour}
              >
                {rescheduleLoading ? "Salvando..." : "Confirmar reagendamento"}
              </button>

              <button
                className="btn btn-danger"
                onClick={cancelReschedule}
                disabled={rescheduleLoading}
              >
                Voltar
              </button>
            </div>
          </div>
        )}

        <button className="modal-close" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
}