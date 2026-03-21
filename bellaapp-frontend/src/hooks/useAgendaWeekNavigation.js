import { useMemo, useState } from "react";

const WEEKDAY_OFFSET = { seg: 0, ter: 1, qua: 2, qui: 3, sex: 4, sab: 5, "sáb": 5, dom: 6 };

function toIsoLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

function getMonday(baseDate) {
  const d = new Date(baseDate);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(date) {
  const monday = getMonday(date);
  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    week.push({
      key: toIsoLocal(d),
      label: d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" }),
    });
  }
  return week;
}

export function normalizeDate(dateStr, baseDate) {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  if (dateStr.includes("T")) return dateStr.split("T")[0];
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    return parts[2] + "-" + parts[1].padStart(2, "0") + "-" + parts[0].padStart(2, "0");
  }
  const token = String(dateStr).toLowerCase().trim();
  const offset = WEEKDAY_OFFSET[token];
  if (offset !== undefined) {
    const monday = getMonday(baseDate);
    const result = new Date(monday);
    result.setDate(monday.getDate() + offset);
    return toIsoLocal(result);
  }
  return dateStr;
}

export default function useAgendaWeekNavigation(initialDate = new Date()) {
  const [currentDate, setCurrentDate] = useState(initialDate);

  function nextWeek() {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  }

  function prevWeek() {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  }

  function goToday() {
    setCurrentDate(new Date());
  }

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  return { currentDate, weekDays, nextWeek, prevWeek, goToday };
}