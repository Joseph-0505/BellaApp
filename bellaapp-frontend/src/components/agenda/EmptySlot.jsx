export default function EmptySlot({ dayLabel, hour, onClick }) {
  // Turn the empty state into a lightweight action, while keeping the cell visually clean.
  return (
    <button
      type="button"
      className="agenda-slot-free"
      aria-label={`Novo agendamento em ${dayLabel} as ${hour}`}
      data-hint="+ Novo agendamento"
      onClick={onClick}
    />
  );
}
