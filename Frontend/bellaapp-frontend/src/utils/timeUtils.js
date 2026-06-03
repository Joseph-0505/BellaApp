export const AGENDA_START_HOUR = 8;
export const AGENDA_END_HOUR = 18;
export const AGENDA_SLOT_INTERVAL = 30;

export function buildDayHourKey(day, hour) {
  const dayKey = day?.split("T")[0] || day;
  const hourKey = String(hour || "").padStart(5, "0");
  return `${dayKey}-${hourKey}`;
}

export function timeToMinutes(time) {
  const [hours, minutes] = String(time || "")
    .split(":")
    .map((value) => Number(value));

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return Number.NaN;
  }

  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes) {
  const safeMinutes = Number(totalMinutes);

  if (!Number.isFinite(safeMinutes)) {
    return "";
  }

  const normalizedMinutes = Math.max(0, Math.trunc(safeMinutes));
  const hours = String(Math.floor(normalizedMinutes / 60)).padStart(2, "0");
  const minutes = String(normalizedMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function generateTimeSlots(
  startHour = AGENDA_START_HOUR,
  endHour = AGENDA_END_HOUR,
  interval = AGENDA_SLOT_INTERVAL
) {
  const slots = [];
  let current = startHour * 60;
  const end = endHour * 60;

  while (current < end) {
    slots.push(minutesToTime(current));
    current += interval;
  }

  return slots;
}

export const DEFAULT_TIME_SLOTS = generateTimeSlots();

export function getSlotSpan(duration, interval = AGENDA_SLOT_INTERVAL) {
  const parsedDuration = Number(duration);

  if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(parsedDuration / interval));
}

export function getAppointmentDurationMinutes(appointment, fallback = AGENDA_SLOT_INTERVAL) {
  const parsedDuration = Number(
    appointment?.duracaoMin ?? appointment?.durationMinutes ?? appointment?.serviceDurationMinutes
  );

  if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
    return fallback;
  }

  return parsedDuration;
}

export function addMinutesToTime(time, minutesToAdd) {
  const currentMinutes = timeToMinutes(time);
  const delta = Number(minutesToAdd);

  if (!Number.isFinite(currentMinutes) || !Number.isFinite(delta)) {
    return "";
  }

  return minutesToTime(currentMinutes + delta);
}

export function getAppointmentEndHour(appointment, interval = AGENDA_SLOT_INTERVAL) {
  return addMinutesToTime(appointment?.hour, getAppointmentDurationMinutes(appointment, interval));
}

export function getSlotWindow(slots, startSlot, span, { clip = false } = {}) {
  const startIndex = slots.indexOf(startSlot);

  if (startIndex < 0) {
    return [];
  }

  const endIndex = startIndex + span;

  if (!clip && endIndex > slots.length) {
    return [];
  }

  return slots.slice(startIndex, Math.min(endIndex, slots.length));
}

export function getAppointmentSlotTimes(
  appointment,
  slots,
  interval = AGENDA_SLOT_INTERVAL,
  options = {}
) {
  const span = getSlotSpan(getAppointmentDurationMinutes(appointment, interval), interval);
  return getSlotWindow(slots, appointment?.hour, span, options);
}

export function getAppointmentSlotKeys(
  appointment,
  slots,
  interval = AGENDA_SLOT_INTERVAL,
  options = {}
) {
  const dayKey = appointment?.day?.split("T")[0] || appointment?.day || "";

  return getAppointmentSlotTimes(appointment, slots, interval, options).map((hour) =>
    buildDayHourKey(dayKey, hour)
  );
}

export function createOccupiedSlotKeySet(
  appointments,
  slots,
  { excludeId, interval = AGENDA_SLOT_INTERVAL } = {}
) {
  const occupiedSlotKeys = new Set();

  appointments.forEach((appointment) => {
    if (!appointment || appointment.id === excludeId) {
      return;
    }

    getAppointmentSlotKeys(appointment, slots, interval, { clip: true }).forEach((key) => {
      occupiedSlotKeys.add(key);
    });
  });

  return occupiedSlotKeys;
}

export function canAppointmentFitInSlots({
  day,
  hour,
  durationMinutes,
  slots,
  occupiedSlotKeys = new Set(),
  interval = AGENDA_SLOT_INTERVAL,
}) {
  const span = getSlotSpan(durationMinutes, interval);
  const slotWindow = getSlotWindow(slots, hour, span);

  if (slotWindow.length !== span) {
    return false;
  }

  return slotWindow.every((slot) => !occupiedSlotKeys.has(buildDayHourKey(day, slot)));
}
