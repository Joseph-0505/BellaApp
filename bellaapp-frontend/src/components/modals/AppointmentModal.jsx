import "../../styles/modals/appointment-modal.css";

export default function AppointmentModal({ appointment, onClose }) {
  if (!appointment) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{appointment.cliente}</h2>

        <p><strong>Serviço:</strong> {appointment.servico}</p>
        <p><strong>Profissional:</strong> {appointment.profissional}</p>
        <p><strong>Recurso:</strong> {appointment.recurso}</p>
        <p><strong>Valor:</strong> R$ {appointment.valorEstimado}</p>

        <div className="modal-actions">
          <button className="btn-confirm">Confirmar</button>
          <button className="btn-edit">Reagendar</button>
          <button className="btn-cancel">Cancelar</button>
        </div>

        <button className="modal-close" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
}