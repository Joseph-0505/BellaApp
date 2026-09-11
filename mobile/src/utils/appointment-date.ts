export function parseAppointmentDate(day: string, time: string): Date {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(day);
  if (!match || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new Error("Informe data (DD/MM/AAAA) e horário (HH:MM) válidos.");
  }
  const [, d, m, y] = match;
  const result = new Date(Number(y), Number(m) - 1, Number(d), Number(time.slice(0, 2)), Number(time.slice(3)));
  if (result.getDate() !== Number(d) || result.getMonth() !== Number(m) - 1 || result.getFullYear() !== Number(y)
    || result.getHours() !== Number(time.slice(0, 2)) || result.getMinutes() !== Number(time.slice(3))) {
    throw new Error("Data ou horário inválido.");
  }
  return result;
}
