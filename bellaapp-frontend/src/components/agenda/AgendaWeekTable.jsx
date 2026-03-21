import { useMemo } from "react";
import AgendaSlotCard from "./AgendaSlotCard";
import EmptySlot from "./EmptySlot";

export default function AgendaWeekTable({
  days,
  hours,
  appointments,
  visibleAppointmentIds = new Set(),
  filtersActive = false,
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
            <th>Hora</th>
            {days.map((day) => (
              <th key={day.key}>{day.label}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {hours.map((hour) => (
            <tr key={hour}>
              <td>{hour}</td>

              {days.map((day) => {
                const slotKey = `${day.key}-${hour}`;
                const appointment = appointmentsBySlot.get(slotKey);
                const isDimmed =
                  filtersActive &&
                  appointment &&
                  !visibleAppointmentIds.has(appointment.id);

                return (
                  <td key={day.key + hour}>
                    {appointment ? (
                      <AgendaSlotCard
                        appointment={appointment}
                        isDimmed={isDimmed}
                        onClick={() => onSelect(appointment)}
                      />
                    ) : (
                      <EmptySlot />
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
