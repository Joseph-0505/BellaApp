import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AgendaSlotCard from "./AgendaSlotCard";
import EmptySlot from "./EmptySlot";
import {
  AGENDA_SLOT_INTERVAL,
  buildDayHourKey,
  canAppointmentFitInSlots,
  createOccupiedSlotKeySet,
  getAppointmentDurationMinutes,
  getAppointmentSlotKeys,
  getAppointmentSlotTimes,
} from "../../utils/timeUtils";

const DROP_ANIMATION_MS = 360;
const CLICK_SUPPRESSION_MS = 200;
const DRAG_DATA_TYPE = "application/x-bellaapp-appointment";

function sortAppointmentsByStart(a, b) {
  const dayCompare = String(a?.day || "").localeCompare(String(b?.day || ""));

  if (dayCompare !== 0) {
    return dayCompare;
  }

  return String(a?.hour || "").localeCompare(String(b?.hour || ""));
}

function getAppointmentVisualPriority(appointment) {
  if (appointment?.status === "cancelado") {
    return 2;
  }

  if (appointment?.status === "concluido") {
    return 1;
  }

  return 0;
}

function sortAppointmentsByVisualPriority(a, b) {
  const priorityCompare = getAppointmentVisualPriority(a.appointment) - getAppointmentVisualPriority(b.appointment);

  if (priorityCompare !== 0) {
    return priorityCompare;
  }

  return String(a.appointment?.cliente || "").localeCompare(String(b.appointment?.cliente || ""));
}

function isBlockingAppointmentStatus(status) {
  return status === "pendente" || status === "confirmado";
}

function buildAppointmentOccupancyMap(appointments, hours) {
  const startSlotMap = new Map();
  const continuationSlotKeys = new Set();

  [...appointments].sort(sortAppointmentsByStart).forEach((appointment) => {
    const slotTimes = getAppointmentSlotTimes(appointment, hours, AGENDA_SLOT_INTERVAL, {
      clip: true,
    });

    if (slotTimes.length === 0) {
      return;
    }

    const slotSpan = slotTimes.length;
    const startSlotKey = buildDayHourKey(appointment.day, slotTimes[0]);
    const currentSlot = startSlotMap.get(startSlotKey);
    const nextSlotItem = {
      appointment,
      slotSpan,
    };

    if (currentSlot) {
      currentSlot.items.push(nextSlotItem);
      currentSlot.items.sort(sortAppointmentsByVisualPriority);
      currentSlot.slotSpan = Math.max(currentSlot.slotSpan, slotSpan);
    } else {
      startSlotMap.set(startSlotKey, {
        items: [nextSlotItem],
        slotSpan,
      });
    }

    slotTimes.slice(1).forEach((slotTime) => {
      continuationSlotKeys.add(buildDayHourKey(appointment.day, slotTime));
    });
  });

  return {
    startSlotMap,
    continuationSlotKeys,
  };
}

function readDragPayload(event) {
  const rawPayload =
    event.dataTransfer.getData(DRAG_DATA_TYPE) || event.dataTransfer.getData("text/plain");

  if (!rawPayload) {
    return null;
  }

  try {
    return JSON.parse(rawPayload);
  } catch {
    return null;
  }
}

export default function AgendaWeekTable({
  days,
  hours,
  appointments,
  allAppointments = appointments,
  visibleAppointmentIds = new Set(),
  filtersActive = false,
  onCreate,
  onMoveAppointment,
  onSelect,
}) {
  const [draggedAppointmentId, setDraggedAppointmentId] = useState("");
  const [activeDropState, setActiveDropState] = useState({ slotKey: "", isValid: false });
  const [movingAppointmentId, setMovingAppointmentId] = useState("");
  const [settledDrop, setSettledDrop] = useState({ appointmentId: "", slotKey: "" });
  const clickSuppressionUntilRef = useRef(0);

  useEffect(() => {
    if (!settledDrop.slotKey) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSettledDrop({ appointmentId: "", slotKey: "" });
    }, DROP_ANIMATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [settledDrop]);

  const appointmentOccupancy = useMemo(
    () => buildAppointmentOccupancyMap(appointments, hours),
    [appointments, hours]
  );

  const allAppointmentOccupancy = useMemo(
    () => buildAppointmentOccupancyMap(allAppointments, hours),
    [allAppointments, hours]
  );

  const allAppointmentsById = useMemo(
    () => new Map(allAppointments.map((appointment) => [appointment.id, appointment])),
    [allAppointments]
  );

  const allBlockingAppointments = useMemo(
    () => allAppointments.filter((appointment) => isBlockingAppointmentStatus(appointment.status)),
    [allAppointments]
  );

  const allOccupiedSlotKeys = useMemo(
    () => createOccupiedSlotKeySet(allBlockingAppointments, hours),
    [allBlockingAppointments, hours]
  );

  const occupiedSlotKeysByAppointmentId = useMemo(() => {
    const appointmentKeys = new Map();

    allBlockingAppointments.forEach((appointment) => {
      appointmentKeys.set(
        appointment.id,
        new Set(getAppointmentSlotKeys(appointment, hours, AGENDA_SLOT_INTERVAL, { clip: true }))
      );
    });

    return appointmentKeys;
  }, [allBlockingAppointments, hours]);

  const suppressClick = useCallback(() => {
    clickSuppressionUntilRef.current = Date.now() + CLICK_SUPPRESSION_MS;
  }, []);

  const clearDragState = useCallback(() => {
    setDraggedAppointmentId("");
    setActiveDropState({ slotKey: "", isValid: false });
  }, []);

  const handleAppointmentSelect = useCallback(
    (appointment) => {
      if (Date.now() < clickSuppressionUntilRef.current) {
        return;
      }

      onSelect?.(appointment);
    },
    [onSelect]
  );

  const canPlaceAppointment = useCallback(
    (appointment, day, hour) => {
      if (!appointment || movingAppointmentId || hours.length === 0) {
        return false;
      }

      const sourceSlotKey = buildDayHourKey(appointment.day, appointment.hour);
      const targetSlotKey = buildDayHourKey(day, hour);

      if (sourceSlotKey === targetSlotKey) {
        return false;
      }

      const occupiedSlotKeys = new Set(allOccupiedSlotKeys);

      for (const key of occupiedSlotKeysByAppointmentId.get(appointment.id) || []) {
        occupiedSlotKeys.delete(key);
      }

      return canAppointmentFitInSlots({
        day,
        hour,
        durationMinutes: getAppointmentDurationMinutes(appointment, AGENDA_SLOT_INTERVAL),
        slots: hours,
        occupiedSlotKeys,
        interval: AGENDA_SLOT_INTERVAL,
      });
    },
    [allOccupiedSlotKeys, hours, movingAppointmentId, occupiedSlotKeysByAppointmentId]
  );

  const handleCardDragStart = useCallback(
    (event, appointment) => {
      if (movingAppointmentId) {
        event.preventDefault();
        return;
      }

      const payload = JSON.stringify({
        id: appointment.id,
        day: appointment.day,
        hour: appointment.hour,
      });

      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.dropEffect = "move";
      event.dataTransfer.setData(DRAG_DATA_TYPE, payload);
      event.dataTransfer.setData("text/plain", payload);

      setDraggedAppointmentId(appointment.id);
      setSettledDrop({ appointmentId: "", slotKey: "" });
    },
    [movingAppointmentId]
  );

  const handleCardDragEnd = useCallback(() => {
    suppressClick();
    clearDragState();
  }, [clearDragState, suppressClick]);

  const handleSlotDragOver = useCallback(
    (event, day, hour) => {
      const payload = readDragPayload(event);
      const appointment = allAppointmentsById.get(payload?.id || draggedAppointmentId);

      if (!appointment) {
        return;
      }

      const slotKey = buildDayHourKey(day, hour);
      const isValid = canPlaceAppointment(appointment, day, hour);

      setActiveDropState((current) =>
        current.slotKey === slotKey && current.isValid === isValid ? current : { slotKey, isValid }
      );

      if (!isValid) {
        event.dataTransfer.dropEffect = "none";
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    },
    [allAppointmentsById, canPlaceAppointment, draggedAppointmentId]
  );

  const handleSlotDragLeave = useCallback((day, hour) => {
    const slotKey = buildDayHourKey(day, hour);

    setActiveDropState((current) =>
      current.slotKey === slotKey ? { slotKey: "", isValid: false } : current
    );
  }, []);

  const handleSlotDrop = useCallback(
    async (event, day, hour) => {
      event.preventDefault();
      suppressClick();

      const payload = readDragPayload(event);
      const appointment = allAppointmentsById.get(payload?.id || draggedAppointmentId);
      const targetSlotKey = buildDayHourKey(day, hour);
      const isValid = canPlaceAppointment(appointment, day, hour);

      clearDragState();

      if (!appointment || !isValid || !onMoveAppointment) {
        return;
      }

      setMovingAppointmentId(appointment.id);

      try {
        const result = await onMoveAppointment(appointment.id, {
          status: "pendente",
          day,
          hour,
        });

        if (result !== false) {
          setSettledDrop({ appointmentId: appointment.id, slotKey: targetSlotKey });
        }
      } finally {
        setMovingAppointmentId("");
      }
    },
    [
      allAppointmentsById,
      canPlaceAppointment,
      clearDragState,
      draggedAppointmentId,
      onMoveAppointment,
      suppressClick,
    ]
  );

  const hasActiveDrag = Boolean(draggedAppointmentId);

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
                const slotKey = buildDayHourKey(day.key, hour);
                const visibleSlotMeta = appointmentOccupancy.startSlotMap.get(slotKey);
                const allSlotMeta = allAppointmentOccupancy.startSlotMap.get(slotKey);
                const visibleAppointmentsAtSlot = visibleSlotMeta?.items || [];

                if (!visibleSlotMeta && appointmentOccupancy.continuationSlotKeys.has(slotKey)) {
                  return null;
                }

                if (
                  !visibleSlotMeta &&
                  !allSlotMeta &&
                  allAppointmentOccupancy.continuationSlotKeys.has(slotKey)
                ) {
                  return null;
                }

                const appointment =
                  visibleAppointmentsAtSlot.length === 1 ? visibleAppointmentsAtSlot[0].appointment : null;
                const hiddenAppointmentGroup =
                  filtersActive &&
                  visibleAppointmentsAtSlot.length === 0 &&
                  allSlotMeta?.items?.some((item) => !visibleAppointmentIds.has(item.appointment.id))
                    ? allSlotMeta
                    : null;
                const slotSpan = visibleSlotMeta?.slotSpan || hiddenAppointmentGroup?.slotSpan || 1;
                const isDropTarget =
                  hasActiveDrag && activeDropState.slotKey === slotKey && activeDropState.isValid;
                const isDropInvalid =
                  hasActiveDrag && activeDropState.slotKey === slotKey && !activeDropState.isValid;
                const cellClassName = `agenda-slot-cell${
                  visibleAppointmentsAtSlot.length > 0
                    ? " has-appointment"
                    : hiddenAppointmentGroup
                      ? " is-filtered"
                      : " is-empty"
                }${visibleAppointmentsAtSlot.length > 1 ? " has-appointment-stack" : ""}${
                  isDropTarget ? " is-drop-target" : ""
                }${isDropInvalid ? " is-drop-invalid" : ""}`;

                return (
                  <td
                    className={cellClassName}
                    key={slotKey}
                    rowSpan={slotSpan}
                    onDragLeave={() => handleSlotDragLeave(day.key, hour)}
                    onDragOver={(event) => handleSlotDragOver(event, day.key, hour)}
                    onDrop={(event) => handleSlotDrop(event, day.key, hour)}
                  >
                    {visibleAppointmentsAtSlot.length > 1 ? (
                      <div className="agenda-slot-stack" style={{ "--slot-span": slotSpan }}>
                        {visibleAppointmentsAtSlot.map((slotItem) => (
                          <AgendaSlotCard
                            key={slotItem.appointment.id}
                            appointment={slotItem.appointment}
                            draggable={!movingAppointmentId}
                            isDragging={draggedAppointmentId === slotItem.appointment.id}
                            isDropSettled={
                              settledDrop.appointmentId === slotItem.appointment.id &&
                              settledDrop.slotKey === slotKey
                            }
                            onClick={() => handleAppointmentSelect(slotItem.appointment)}
                            onDragEnd={handleCardDragEnd}
                            onDragStart={(event) => handleCardDragStart(event, slotItem.appointment)}
                            slotSpan={1}
                            stacked
                          />
                        ))}
                      </div>
                    ) : appointment ? (
                      <AgendaSlotCard
                        appointment={appointment}
                        draggable={!movingAppointmentId}
                        isDragging={draggedAppointmentId === appointment.id}
                        isDropSettled={
                          settledDrop.appointmentId === appointment.id && settledDrop.slotKey === slotKey
                        }
                        onClick={() => handleAppointmentSelect(appointment)}
                        onDragEnd={handleCardDragEnd}
                        onDragStart={(event) => handleCardDragStart(event, appointment)}
                        slotSpan={slotSpan}
                      />
                    ) : hiddenAppointmentGroup ? (
                      <div className="agenda-slot-filtered" aria-hidden="true" style={{ "--slot-span": slotSpan }}>
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