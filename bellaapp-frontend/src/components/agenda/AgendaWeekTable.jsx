import { useMemo } from "react";
import AgendaSlotCard from "./AgendaSlotCard";
import EmptySlot from "./EmptySlot";

export default function AgendaWeekTable({
  days,
  hours,
  appointments,
  visibleAppointmentIds = new Set(),
  filtersActive = false,
  onCreate,
  onSelect,
}) {
  const appointmentsBySlot = useMemo(() => {
    return new Map(
      appointments.map((appointment) => {
        const dayKey = appointment.day?.split("T")[0] || appointment.day;
        const hourKey = String(appointment.hour || "").padStart(5, "0");

        return [`${dayKey}-${hourKey}`, appointment];
      })
    );
  }, [appointments]);

  return (
    <div className="agenda-table-wrap">
      <table className="agenda-table agenda-week-table">
        <thead>
          <tr>
            <th className="agenda-hour-header">Hora</th>
            {days.map((day) => (
              <th className="agenda-day-header-cell" key={day.key}>
                {/* Split weekday and day number to improve scanability across the week. */}
                <div className="agenda-day-header">
                  <span className="agenda-day-weekday">{day.weekdayShort}</span>
                  <strong className="agenda-day-number">{day.dayNumber}</strong>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {hours.map((hour) => (
            <tr key={hour}>
              <td className="agenda-hour-cell">{hour}</td>

              {days.map((day) => {
                const slotKey = `${day.key}-${hour}`;
                const appointment = appointmentsBySlot.get(slotKey);
                const isDimmed =
                  filtersActive &&
                  appointment &&
                  !visibleAppointmentIds.has(appointment.id);

                return (
                  <td
                    className={`agenda-slot-cell${appointment ? " has-appointment" : " is-empty"}`}
                    key={day.key + hour}
                  >
                    {appointment ? (
                      <AgendaSlotCard
                        appointment={appointment}
                        isDimmed={isDimmed}
                        onClick={() => onSelect(appointment)}
                      />
                    ) : (
                      // Empty slots now point to the existing creation flow, prefilled with day and hour.
                      <EmptySlot
                        dayLabel={`${day.weekdayShort} ${day.dayNumber}`}
                        hour={hour}
                        onClick={() => onCreate?.({ day: day.key, hour })}
                      />
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
