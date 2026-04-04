import { useMemo } from "react";
import AgendaSlotCard from "./AgendaSlotCard";
import EmptySlot from "./EmptySlot";

export default function AgendaWeekTable({
  days,
  hours,
  appointments,
  allAppointments = appointments,
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

  const allAppointmentsBySlot = useMemo(() => {
    return new Map(
      allAppointments.map((appointment) => {
        const dayKey = appointment.day?.split("T")[0] || appointment.day;
        const hourKey = String(appointment.hour || "").padStart(5, "0");

        return [`${dayKey}-${hourKey}`, appointment];
      })
    );
  }, [allAppointments]);

  return (
    <div className="agenda-table-wrap">
      <table className="agenda-table agenda-week-table">
        <thead>
          <tr>
            <th className="agenda-hour-header">Hora</th>
            {days.map((day) => (
              <th className="agenda-day-header-cell" key={day.key}>
              
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
                const hasHiddenAppointment =
                  filtersActive &&
                  allAppointmentsBySlot.has(slotKey) &&
                  (!appointment || !visibleAppointmentIds.has(appointment.id));

                return (
                  <td
                    className={`agenda-slot-cell${appointment ? " has-appointment" : hasHiddenAppointment ? " is-filtered" : " is-empty"}`}
                    key={day.key + hour}
                  >
                    {appointment ? (
                      <AgendaSlotCard
                        appointment={appointment}
                        onClick={() => onSelect(appointment)}
                      />
                    ) : hasHiddenAppointment ? (
                      <div className="agenda-slot-filtered" aria-hidden="true">
                        Oculto pelo filtro
                      </div>
                    ) : (
                      
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
