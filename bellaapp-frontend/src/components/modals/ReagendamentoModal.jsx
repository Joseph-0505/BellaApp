import FormModalShell from "./FormModalShell";
import "../../styles/modals/appointment-modal.css";

import useReschedule from "../../hooks/useReschedule.js";

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T12:00:00`));
}

export default function ReagendamentoModal({
  appointment,
  onClose,
  onUpdate,
  appointments = [],
  hours = [],
  scheduleLoading = false,
  loadWeekData,
  onBack,
}) {
  const {
    availableDays,
    daySlots,
    selectedDay,
    selectedHour,
    loading: rescheduleLoading,
    dayLoading,
    weekLoading,
    weekLabel,
    cancelReschedule,
    selectDay,
    selectSlot,
    saveReschedule,
    nextWeek,
    prevWeek,
  } = useReschedule({
    appointment,
    onUpdate,
    onClose,
    appointments,
    hours,
    initialMode: "reschedule",
    loadWeekData,
  });

  if (!appointment) {
    return null;
  }

  const isWeekLoading = scheduleLoading || weekLoading;
  const isSlotLoading = isWeekLoading || dayLoading;
  const hasAvailableSlots = daySlots.some((slot) => slot.isAvailable);

  function handleBack() {
    cancelReschedule();
    if (onBack) {
      onBack();
      return;
    }

    onClose?.();
  }

  return (
    <FormModalShell
      description="Escolha uma nova semana, data e horário para o atendimento atual."
      onClose={onClose}
      size="compact"
      title="Reagendar agendamento"
    >
      <div className="form-modal-form">
        {/* Mantem o contexto do atendimento enquanto o usuario escolhe a nova data. */}
        <div className="appointment-modal-summary">
          <span className="appointment-modal-summary-label">Agendamento atual</span>
          <strong>{appointment.cliente}</strong>

          <div className="appointment-modal-summary-meta">
            <span className="appointment-modal-summary-chip">{appointment.servico}</span>
            <span className="appointment-modal-summary-chip">{formatDate(appointment.day)}</span>
            <span className="appointment-modal-summary-chip">{appointment.hour}</span>
          </div>
        </div>

        <div className="appointment-modal-section">
          <div className="appointment-modal-week-nav">
            <button
              type="button"
              className="appointment-modal-nav-btn"
              onClick={prevWeek}
              disabled={isWeekLoading || rescheduleLoading}
            >
              Semana anterior
            </button>

            <strong className="appointment-modal-week-label">{weekLabel}</strong>

            <button
              type="button"
              className="appointment-modal-nav-btn"
              onClick={nextWeek}
              disabled={isWeekLoading || rescheduleLoading}
            >
              Próxima semana
            </button>
          </div>

          <h3>Escolha um dia</h3>
          <p className="appointment-modal-section-hint">
            Os dias sao atualizados conforme a semana selecionada.
          </p>

          {isWeekLoading ? (
            <p className="appointment-modal-loading-label">Atualizando disponibilidade da semana...</p>
          ) : null}

          <div className={`days-grid${isWeekLoading ? " is-loading" : ""}`} aria-busy={isWeekLoading}>
            {availableDays.map((day) => {
              const isSelected = selectedDay === day.key;

              return (
                <button
                  type="button"
                  key={day.key}
                  className={`slot-btn ${isSelected ? "selected" : ""}`}
                  onClick={() => selectDay(day.key)}
                  disabled={isWeekLoading || day.count === 0}
                  title={day.count === 0 ? "Sem horarios disponiveis nesta data." : `${day.count} horarios livres`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="appointment-modal-section">
          <h3>Escolha um novo horário</h3>
          <p className="appointment-modal-section-hint">
            Horários ocupados aparecem como indisponíveis e não aceitam clique.
          </p>

          {selectedDay ? (
            <>
              {isSlotLoading ? (
                <p className="appointment-modal-loading-label">Atualizando horários...</p>
              ) : null}

              <div className={`slots-grid${isSlotLoading ? " is-loading" : ""}`} aria-busy={isSlotLoading}>
                {daySlots.map((slot) => (
                  <button
                    type="button"
                    key={`${slot.day}-${slot.hour}`}
                    className={`slot-btn ${slot.status}${slot.isSelected ? " selected" : ""}`}
                    onClick={() => selectSlot(slot.day, slot.hour)}
                    disabled={isSlotLoading || !slot.isAvailable}
                  >
                    {slot.hour}
                  </button>
                ))}
              </div>

              {!isSlotLoading && !hasAvailableSlots ? (
                <p className="appointment-modal-empty">Nenhum horário disponível para este dia.</p>
              ) : null}
            </>
          ) : (
            <p className="appointment-modal-empty">Selecione um dia para ver os horários livres.</p>
          )}
        </div>

        <div className="form-modal-footer">
          <button
            type="button"
            className="form-modal-button form-modal-button-secondary"
            onClick={handleBack}
            disabled={rescheduleLoading}
          >
            Voltar
          </button>

          <button
            type="button"
            className="form-modal-button form-modal-button-primary appointment-modal-confirm-button"
            onClick={saveReschedule}
            disabled={isSlotLoading || rescheduleLoading || !selectedDay || !selectedHour}
          >
            {rescheduleLoading ? "Salvando..." : "Confirmar reagendamento"}
          </button>
        </div>
      </div>
    </FormModalShell>
  );
}
