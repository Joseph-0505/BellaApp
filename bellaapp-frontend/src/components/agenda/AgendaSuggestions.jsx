export default function AgendaSuggestions({ slots = [] }) {
  const nextSlots = slots.slice(0, 5);

  return (
    <div
      id="agenda-available-slots"
      className="panel agenda-panel-content"
    >
      <h2>Horários livres para novo agendamento</h2>

      {nextSlots.length === 0 ? (
        <p className="agenda-panel-empty">
          Nenhum horário livre encontrado nesta semana.
        </p>
      ) : (
        <ul className="agenda-list">
          {nextSlots.map((slot) => (
            <li
              key={`${slot.day}-${slot.hour}`}
              className="agenda-list-item"
            >
              <span className="agenda-list-day">{slot.label}</span>
              <strong className="agenda-list-time">{slot.hour}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
