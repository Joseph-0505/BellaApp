
import AgendaSlotCard from "./AgendaSlotCard";


export default function AgendaWeekTable({ days, hours, appointments }) {
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
                const appt = appointments.find(
                  (a) => a.day === d.key && a.hour === hour
                );

                return (
                  <td key={d.key + hour}>
                    {appt ? (
                      <AgendaSlotCard appointment={appt} />
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