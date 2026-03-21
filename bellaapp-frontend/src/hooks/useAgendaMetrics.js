import { useMemo } from "react";

export default function useAgendaMetrics({ appointments, term, status, weekDays, hours }) {
  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const t = (term || "").toLowerCase();
      const matchTerm =
        !t ||
        a.cliente.toLowerCase().includes(t) ||
        a.servico.toLowerCase().includes(t);

      const matchStatus = status === "todos" || a.status === status;
      return matchTerm && matchStatus;
    });
  }, [appointments, term, status]);

  const resumoAgenda = useMemo(() => {
    const receitaProjetada = filtered.reduce((acc, a) => acc + Number(a.valorEstimado || 0), 0);
    const riscoAlto = filtered.filter((a) => a.riscoNoShow === "alto").length;
    const pendentes = filtered.filter((a) => a.status === "pendente").length;
    return { receitaProjetada, riscoAlto, pendentes };
  }, [filtered]);

  const livresAgora = useMemo(() => {
    const busyKeys = new Set(filtered.map((a) => a.day + "-" + a.hour));
    return weekDays
      .flatMap((d) => hours.map((h) => ({ day: d.key, label: d.label, hour: h })))
      .filter((slot) => !busyKeys.has(slot.day + "-" + slot.hour))
      .slice(0, 5);
  }, [filtered, weekDays, hours]);

  return { filtered, resumoAgenda, livresAgora };
}