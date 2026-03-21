import AgendaSlotCard from "./AgendaSlotCard";

export default function AgendaWeekTable({ days, hours, appointments, onSelect }) {
  return (
    <div className="agenda-table-wrap">
      <table className="agenda-table agenda-week-table">
        <thead>
          <tr>
            <th>Hora</th>
            {days.map((d) => (
              <th key={d.key}>{d.label}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {hours.map((hour) => (
            <tr key={hour}>
              <td>{hour}</td>

              {days.map((d) => {
                const appt = appointments.find((a) => {
                  const day = a.day?.split("T")[0];
                  const hourFormatted = a.hour?.padStart(5, "0");

                  return day === d.key && hourFormatted === hour;
                });

                return (
                  <td key={d.key + hour}>
                    {appt ? (
                      <AgendaSlotCard
                        appointment={appt}
                        onClick={() => onSelect(appt)}
                      />
                    ) : (
                      <span className="agenda-slot-free">Livre</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}