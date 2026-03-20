export default function AgendaFreeSlots({ livresAgora }) {
  return (
    <div className="panel agenda-panel-content">
      <h2>Horario livre agora</h2>

      {livresAgora.map((slot) => (
        <p
          key={slot.day + slot.hour}
          className="agenda-item-row"
        >
          {slot.label} - {slot.hour}
        </p>
      ))}
    </div>
  );
}